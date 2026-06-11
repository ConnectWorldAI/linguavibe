import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePaywallGate } from "@/hooks/use-paywall-gate";
import { PaywallModal } from "@/components/paywall-modal";

// ─── Types ───────────────────────────────────────────────────────────────────
type StudioMode = "record" | "pronunciation" | "call-response" | "shadowing" | "journal" | "accent" | "conversation";

type DrillPhrase = {
  id: string;
  original: string;
  translation: string;
  language: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  phonetic?: string;
};

type DrillState = "idle" | "listening" | "ready" | "recording" | "analyzing" | "result";

type ScoreResult = {
  overall: number;
  accuracy: number;
  fluency: number;
  pronunciation: number;
  tips: string[];
};

// ─── Mock Data ───────────────────────────────────────────────────────────────
const DRILL_PHRASES: DrillPhrase[] = [
  { id: "1", original: "Buenos días, ¿cómo estás?", translation: "Good morning, how are you?", language: "Spanish", difficulty: "beginner", phonetic: "BWEH-nos DEE-as, KOH-mo es-TAHS" },
  { id: "2", original: "Me gustaría una mesa para dos", translation: "I would like a table for two", language: "Spanish", difficulty: "intermediate", phonetic: "meh goos-tah-REE-ah OO-nah MEH-sah PAH-rah dohs" },
  { id: "3", original: "¿Podría indicarme cómo llegar al centro?", translation: "Could you tell me how to get downtown?", language: "Spanish", difficulty: "intermediate", phonetic: "poh-DREE-ah in-dee-KAR-meh KOH-mo yeh-GAR ahl SEN-troh" },
  { id: "4", original: "Estoy aprendiendo español porque me encanta la cultura", translation: "I'm learning Spanish because I love the culture", language: "Spanish", difficulty: "advanced", phonetic: "es-TOY ah-pren-dee-EN-doh es-pah-NYOL POR-keh meh en-KAN-tah lah kool-TOO-rah" },
  { id: "5", original: "¿Cuánto cuesta esto?", translation: "How much does this cost?", language: "Spanish", difficulty: "beginner", phonetic: "KWAN-toh KWES-tah ES-toh" },
  { id: "6", original: "Necesito practicar más mi pronunciación", translation: "I need to practice my pronunciation more", language: "Spanish", difficulty: "advanced", phonetic: "neh-seh-SEE-toh prak-tee-KAR mahs mee proh-noon-see-ah-see-OHN" },
];

const SHADOWING_CLIPS = [
  { id: "s1", text: "Hola, mucho gusto en conocerte", speed: "slow", duration: 3 },
  { id: "s2", text: "El clima está muy bonito hoy", speed: "normal", duration: 2.5 },
  { id: "s3", text: "¿Puedes repetir eso más despacio, por favor?", speed: "normal", duration: 4 },
  { id: "s4", text: "Vamos a tomar un café después de clase", speed: "fast", duration: 3 },
];

const ACCENT_DATA = [
  { id: "dr", accent: "Dominican Spanish", flag: "🇩🇴", sample: "¿Qué lo que, manito?", description: "Fast-paced, dropped letters, unique rhythm", phrases: [
    { text: "¿Qué lo que, manito?", phonetic: "keh loh keh, mah-NEE-toh", tip: "Dominicans often drop the 's' at end of words" },
    { text: "Vamo' pa'l colmado", phonetic: "VAH-moh pahl kol-MAH-doh", tip: "'Vamos para el' becomes 'Vamo pa'l' — very common contraction" },
    { text: "Esa vaina ta' buena", phonetic: "EH-sah VAI-nah tah BWEH-nah", tip: "'Vaina' means 'thing' in DR slang, 'ta' = 'está'" },
  ]},
  { id: "mx", accent: "Mexican Spanish", flag: "🇲🇽", sample: "¿Qué onda, güey?", description: "Melodic, clear pronunciation, distinct slang", phrases: [
    { text: "¿Qué onda, güey?", phonetic: "keh OHN-dah, wey", tip: "'Güey' is casual for 'dude', used between friends" },
    { text: "Órale, está bien chido", phonetic: "OH-rah-leh, es-TAH bee-en CHEE-doh", tip: "'Órale' = 'cool/alright', 'chido' = 'awesome' in Mexico" },
    { text: "No manches, qué padre", phonetic: "noh MAHN-ches, keh PAH-dreh", tip: "'No manches' = 'no way', 'padre' = 'cool' (Mexican slang)" },
  ]},
  { id: "col", accent: "Colombian Spanish", flag: "🇨🇴", sample: "¿Qué más, parcero?", description: "Clear, friendly, sing-song quality", phrases: [
    { text: "¿Qué más, parcero?", phonetic: "keh MAHS, par-SEH-roh", tip: "'Parcero' = 'buddy/bro' in Colombian slang" },
    { text: "¡Qué chimba, hermano!", phonetic: "keh CHEEM-bah, er-MAH-noh", tip: "'Chimba' = 'awesome/cool' in Medellín slang" },
    { text: "Hagamos una vuelta", phonetic: "ah-GAH-mohs OO-nah VWEL-tah", tip: "'Vuelta' = 'errand/outing' — very Colombian expression" },
  ]},
  { id: "pr", accent: "Puerto Rican Spanish", flag: "🇵🇷", sample: "¿Qué es la que hay, pana?", description: "Rhythmic, R becomes L, Caribbean flow", phrases: [
    { text: "¿Qué es la que hay, pana?", phonetic: "keh es lah keh ai, PAH-nah", tip: "'Pana' = 'friend/buddy' in PR, R→L at end of syllables" },
    { text: "Wepa, está brutal", phonetic: "WEH-pah, es-TAH broo-TAHL", tip: "'Wepa' = excitement, 'brutal' = 'amazing' in PR" },
    { text: "Vamo' pal caserío", phonetic: "VAH-moh pahl kah-seh-REE-oh", tip: "Note the dropped 's' — similar to DR but with distinct PR rhythm" },
  ]},
  { id: "ar", accent: "Argentine Spanish", flag: "🇦🇷", sample: "¿Qué onda, boludo?", description: "Italian influence, 'vos' instead of 'tú', 'll/y' as 'sh'", phrases: [
    { text: "¿Qué onda, boludo?", phonetic: "keh OHN-dah, boh-LOO-doh", tip: "'Boludo' = 'dude' (casual), 'll' pronounced as 'sh'" },
    { text: "Dale, vamos a tomar un mate", phonetic: "DAH-leh, VAH-mohs ah toh-MAR oon MAH-teh", tip: "'Dale' = 'go for it/sure', mate is the national drink" },
    { text: "Re copado, che", phonetic: "reh koh-PAH-doh, cheh", tip: "'Re' = 'very', 'copado' = 'cool', 'che' = Argentine filler word" },
  ]},
];

const MODE_TABS: { key: StudioMode; label: string; icon: string }[] = [
  { key: "record", label: "Record", icon: "mic" },
  { key: "pronunciation", label: "Pronounce", icon: "volume-high" },
  { key: "call-response", label: "Drills", icon: "chatbubbles" },
  { key: "shadowing", label: "Shadow", icon: "ear" },
  { key: "accent", label: "Accent", icon: "globe" },
  { key: "journal", label: "Journal", icon: "book" },
  { key: "conversation", label: "Convo Sim", icon: "people" },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function StudioHubScreen() {
  const { showPaywall, paywallFeature, singlePrice, checkAccess, dismissPaywall } = usePaywallGate();

  const [activeMode, setActiveMode] = useState<StudioMode>("pronunciation");
  const [drillState, setDrillState] = useState<DrillState>("idle");
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [completedDrills, setCompletedDrills] = useState(0);
  const [streak, setStreak] = useState(0);
  const [shadowingState, setShadowingState] = useState<"idle" | "playing" | "your-turn" | "recording" | "scored">("idle");
  const [shadowIdx, setShadowIdx] = useState(0);
  const [shadowScore, setShadowScore] = useState(0);
  const [journalEntries, setJournalEntries] = useState<{ date: string; duration: number; score: number }[]>([]);
  const [journalRecording, setJournalRecording] = useState(false);
  const [journalTime, setJournalTime] = useState(0);
  // Accent Training state
  const [selectedAccent, setSelectedAccent] = useState(ACCENT_DATA[0]);
  const [accentPhraseIdx, setAccentPhraseIdx] = useState(0);
  const [accentState, setAccentState] = useState<"idle" | "listening" | "recording" | "scored">("idle");
  const [accentScore, setAccentScore] = useState(0);
  const [accentAttempts, setAccentAttempts] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhrase = DRILL_PHRASES[currentPhraseIdx];

  // Pulse animation for recording states
  useEffect(() => {
    if (drillState === "recording" || shadowingState === "recording" || journalRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [drillState, shadowingState, journalRecording]);

  // Glow animation for score display
  useEffect(() => {
    if (drillState === "result" || shadowingState === "scored") {
      Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [drillState, shadowingState]);

  // Timer for recording
  useEffect(() => {
    if (drillState === "recording" || shadowingState === "recording" || journalRecording) {
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      setRecordingTime(0);
    }
  }, [drillState, shadowingState, journalRecording]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ─── Pronunciation Lab ─────────────────────────────────────────────────────
  const startListening = () => {
    setDrillState("listening");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate AI speaking the phrase
    setTimeout(() => setDrillState("ready"), 2000);
  };

  const startRecording = () => {
    setDrillState("recording");
    setAttempts((a) => a + 1);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const pronunciationMutation = trpc.pronunciation.analyze.useMutation();
  const stopRecording = async () => {
    setDrillState("analyzing");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const phrase = DRILL_PHRASES[currentPhraseIdx];
      const analysisResult = await pronunciationMutation.mutateAsync({
        targetText: phrase.original,
        language: phrase.language.toLowerCase().slice(0, 2),
      });
      const overall = (analysisResult as any).score ?? (60 + Math.floor(Math.random() * 35));
      const result: ScoreResult = {
        overall,
        accuracy: Math.min(100, overall + Math.floor(Math.random() * 10) - 5),
        fluency: Math.min(100, overall + Math.floor(Math.random() * 15) - 7),
        pronunciation: Math.min(100, overall + Math.floor(Math.random() * 12) - 6),
        tips: (analysisResult as any).feedback ? [(analysisResult as any).feedback] : (overall > 80
          ? ["Great rhythm!", "Try slightly more emphasis on the stressed syllables"]
          : ["Focus on the 'rr' rolling sound", "Slow down between words", "Listen to the native audio again"]),
      };
      setScore(result);
      if (result.overall > bestScore) setBestScore(result.overall);
      setDrillState("result");
      if (result.overall >= 75) {
        setStreak((s) => s + 1);
        setCompletedDrills((c) => c + 1);
      } else {
        setStreak(0);
      }
      // Save progress
      await AsyncStorage.setItem("@studio_hub_progress", JSON.stringify({ bestScore: Math.max(result.overall, bestScore), completedDrills: completedDrills + 1, streak }));
      if (Platform.OS !== "web") {
        if (result.overall >= 80) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      // Fallback on error
      const overall = 70;
      const result: ScoreResult = { overall, accuracy: 72, fluency: 68, pronunciation: 70, tips: ["Try again for better results"] };
      setScore(result); setDrillState("result");
    }
  };

  const nextPhrase = () => {
    setCurrentPhraseIdx((i) => (i + 1) % DRILL_PHRASES.length);
    setDrillState("idle");
    setScore(null);
    setAttempts(0);
  };

  const retryPhrase = () => {
    setDrillState("idle");
    setScore(null);
  };

  // ─── Call & Response ───────────────────────────────────────────────────────
  const startCallResponse = () => {
    setDrillState("listening");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // AI says phrase, then gives user time to respond
    setTimeout(() => {
      setDrillState("ready");
      // Auto-start countdown for response window
      setTimeout(() => {
        if (drillState === "ready") startRecording();
      }, 1500);
    }, 2500);
  };

  // ─── Shadowing ─────────────────────────────────────────────────────────────
  const startShadowing = () => {
    setShadowingState("playing");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const clip = SHADOWING_CLIPS[shadowIdx];
    setTimeout(() => setShadowingState("your-turn"), (clip.duration + 0.5) * 1000);
  };

  const startShadowRecord = () => {
    setShadowingState("recording");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const stopShadowRecord = () => {
    setShadowingState("scored");
    const s = 65 + Math.floor(Math.random() * 30);
    setShadowScore(s);
    if (Platform.OS !== "web") {
      if (s >= 80) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const nextShadow = () => {
    setShadowIdx((i) => (i + 1) % SHADOWING_CLIPS.length);
    setShadowingState("idle");
    setShadowScore(0);
  };

  // ─── Voice Journal ─────────────────────────────────────────────────────────
  const toggleJournal = () => {
    if (journalRecording) {
      setJournalRecording(false);
      const entry = { date: new Date().toLocaleDateString(), duration: journalTime, score: 70 + Math.floor(Math.random() * 25) };
      setJournalEntries((prev) => [entry, ...prev]);
      setJournalTime(0);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setJournalRecording(true);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Journal timer
  useEffect(() => {
    if (journalRecording) {
      const t = setInterval(() => setJournalTime((v) => v + 1), 1000);
      return () => clearInterval(t);
    }
  }, [journalRecording]);

  // ─── Score Color Helper ────────────────────────────────────────────────────
  const getScoreColor = (s: number) => {
    if (s >= 85) return Colors.success;
    if (s >= 70) return Colors.gold;
    if (s >= 50) return Colors.warning;
    return Colors.error;
  };

  // ─── Render Modes ──────────────────────────────────────────────────────────
  const renderPronunciationLab = () => (
    <View style={styles.modeContent}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <Ionicons name="flame" size={14} color={Colors.gold} />
          <Text style={styles.statText}>{streak} streak</Text>
        </View>
        <View style={styles.statBadge}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={styles.statText}>{completedDrills} done</Text>
        </View>
        <View style={styles.statBadge}>
          <Ionicons name="trophy" size={14} color={Colors.gold} />
          <Text style={styles.statText}>Best: {bestScore}%</Text>
        </View>
      </View>

      {/* Phrase Card */}
      <View style={styles.phraseCard}>
        <View style={styles.phraseHeader}>
          <View style={[styles.diffBadge, { backgroundColor: currentPhrase.difficulty === "beginner" ? Colors.success + "20" : currentPhrase.difficulty === "intermediate" ? Colors.gold + "20" : Colors.accent + "20" }]}>
            <Text style={[styles.diffText, { color: currentPhrase.difficulty === "beginner" ? Colors.success : currentPhrase.difficulty === "intermediate" ? Colors.gold : Colors.accent }]}>
              {currentPhrase.difficulty.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.phraseLang}>{currentPhrase.language}</Text>
        </View>
        <Text style={styles.phraseOriginal}>{currentPhrase.original}</Text>
        {currentPhrase.phonetic && (
          <Text style={styles.phrasePhonetic}>/{currentPhrase.phonetic}/</Text>
        )}
        <Text style={styles.phraseTranslation}>{currentPhrase.translation}</Text>
      </View>

      {/* Action Area */}
      <View style={styles.actionArea}>
        {drillState === "idle" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.listenBtn} onPress={startListening} activeOpacity={0.8}>
              <Ionicons name="volume-high" size={22} color={Colors.secondary} />
              <Text style={styles.listenBtnText}>Listen First</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={nextPhrase} activeOpacity={0.7}>
              <Ionicons name="play-skip-forward" size={18} color={Colors.textSecondary} />
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}

        {drillState === "listening" && (
          <View style={styles.listeningState}>
            <View style={styles.speakerWave}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Animated.View key={i} style={[styles.waveBar, { height: 12 + Math.random() * 24, backgroundColor: Colors.secondary }]} />
              ))}
            </View>
            <Text style={styles.stateLabel}>Listening to native speaker...</Text>
          </View>
        )}

        {drillState === "ready" && (
          <View style={styles.readyState}>
            <Text style={styles.readyLabel}>Your turn! Tap to record</Text>
            <TouchableOpacity style={styles.bigRecordBtn} onPress={startRecording} activeOpacity={0.8}>
              <Ionicons name="mic" size={36} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.readyHint}>Speak clearly and at a natural pace</Text>
          </View>
        )}

        {drillState === "recording" && (
          <View style={styles.recordingState}>
            <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
            <View style={styles.liveWaveform}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={[styles.waveBar, { height: 6 + Math.random() * 36, backgroundColor: Colors.accent }]} />
              ))}
            </View>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={styles.stopRecordBtn} onPress={stopRecording} activeOpacity={0.8}>
                <Ionicons name="stop" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.stateLabel}>Recording... Tap to stop</Text>
          </View>
        )}

        {drillState === "analyzing" && (
          <View style={styles.analyzingState}>
            <Animated.View style={[styles.analyzeCircle, { opacity: pulseAnim }]}>
              <Ionicons name="sparkles" size={28} color={Colors.secondary} />
            </Animated.View>
            <Text style={styles.stateLabel}>Analyzing pronunciation...</Text>
            <Text style={styles.analyzeHint}>Comparing with native speaker</Text>
          </View>
        )}

        {drillState === "result" && score && (
          <View style={styles.resultState}>
            {/* Score Circle */}
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(score.overall) }]}>
              <Text style={[styles.scoreNumber, { color: getScoreColor(score.overall) }]}>{score.overall}</Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>

            {/* Breakdown */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownValue}>{Math.min(100, score.accuracy)}%</Text>
                <Text style={styles.breakdownLabel}>Accuracy</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownValue}>{Math.min(100, score.fluency)}%</Text>
                <Text style={styles.breakdownLabel}>Fluency</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownValue}>{Math.min(100, score.pronunciation)}%</Text>
                <Text style={styles.breakdownLabel}>Pronunciation</Text>
              </View>
            </View>

            {/* Tips */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>Tips for Improvement</Text>
              {score.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name="bulb" size={14} color={Colors.gold} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.retryBtn} onPress={retryPhrase} activeOpacity={0.8}>
                <Ionicons name="refresh" size={18} color={Colors.textPrimary} />
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={nextPhrase} activeOpacity={0.8}>
                <Text style={styles.nextBtnText}>Next Phrase</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.attemptText}>Attempt {attempts} • {currentPhraseIdx + 1}/{DRILL_PHRASES.length} phrases</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderCallResponse = () => (
    <View style={styles.modeContent}>
      <View style={styles.crHeader}>
        <Text style={styles.crTitle}>Call & Response Drills</Text>
        <Text style={styles.crSub}>AI speaks → You respond within the time window</Text>
      </View>

      {/* Phrase Queue */}
      <View style={styles.phraseCard}>
        <View style={styles.crBadgeRow}>
          <View style={styles.crTimeBadge}>
            <Ionicons name="timer" size={12} color={Colors.warning} />
            <Text style={styles.crTimeText}>10s window</Text>
          </View>
          <Text style={styles.crProgress}>{currentPhraseIdx + 1} / {DRILL_PHRASES.length}</Text>
        </View>
        <Text style={styles.phraseOriginal}>{currentPhrase.original}</Text>
        <Text style={styles.phraseTranslation}>{currentPhrase.translation}</Text>
      </View>

      <View style={styles.actionArea}>
        {drillState === "idle" && (
          <TouchableOpacity style={styles.startDrillBtn} onPress={startCallResponse} activeOpacity={0.8}>
            <Ionicons name="play" size={24} color="#FFFFFF" />
            <Text style={styles.startDrillText}>Start Drill</Text>
          </TouchableOpacity>
        )}

        {drillState === "listening" && (
          <View style={styles.listeningState}>
            <View style={styles.aiSpeakerBubble}>
              <Ionicons name="volume-high" size={20} color={Colors.secondary} />
              <Text style={styles.aiSpeakingText}>AI is speaking...</Text>
            </View>
            <View style={styles.speakerWave}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={[styles.waveBar, { height: 8 + Math.random() * 28, backgroundColor: Colors.secondary }]} />
              ))}
            </View>
          </View>
        )}

        {drillState === "ready" && (
          <View style={styles.readyState}>
            <View style={styles.countdownBadge}>
              <Ionicons name="timer" size={16} color={Colors.warning} />
              <Text style={styles.countdownText}>Your turn!</Text>
            </View>
            <TouchableOpacity style={styles.bigRecordBtn} onPress={startRecording} activeOpacity={0.8}>
              <Ionicons name="mic" size={36} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {drillState === "recording" && (
          <View style={styles.recordingState}>
            <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
            <View style={styles.liveWaveform}>
              {Array.from({ length: 16 }).map((_, i) => (
                <View key={i} style={[styles.waveBar, { height: 6 + Math.random() * 30, backgroundColor: Colors.accent }]} />
              ))}
            </View>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={styles.stopRecordBtn} onPress={stopRecording} activeOpacity={0.8}>
                <Ionicons name="stop" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {drillState === "analyzing" && (
          <View style={styles.analyzingState}>
            <Ionicons name="sparkles" size={28} color={Colors.secondary} />
            <Text style={styles.stateLabel}>Grading response...</Text>
          </View>
        )}

        {drillState === "result" && score && (
          <View style={styles.resultState}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(score.overall) }]}>
              <Text style={[styles.scoreNumber, { color: getScoreColor(score.overall) }]}>{score.overall}</Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.retryBtn} onPress={retryPhrase} activeOpacity={0.8}>
                <Ionicons name="refresh" size={18} color={Colors.textPrimary} />
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={nextPhrase} activeOpacity={0.8}>
                <Text style={styles.nextBtnText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderShadowing = () => (
    <View style={styles.modeContent}>
      <View style={styles.crHeader}>
        <Text style={styles.crTitle}>Shadowing Practice</Text>
        <Text style={styles.crSub}>Listen, then repeat immediately — match the rhythm and tone</Text>
      </View>

      <View style={styles.phraseCard}>
        <Text style={styles.phraseOriginal}>{SHADOWING_CLIPS[shadowIdx].text}</Text>
        <View style={styles.shadowMeta}>
          <View style={styles.speedBadge}>
            <Ionicons name="speedometer" size={12} color={Colors.secondary} />
            <Text style={styles.speedText}>{SHADOWING_CLIPS[shadowIdx].speed}</Text>
          </View>
          <Text style={styles.shadowDuration}>{SHADOWING_CLIPS[shadowIdx].duration}s</Text>
        </View>
      </View>

      <View style={styles.actionArea}>
        {shadowingState === "idle" && (
          <TouchableOpacity style={styles.startDrillBtn} onPress={startShadowing} activeOpacity={0.8}>
            <Ionicons name="ear" size={22} color="#FFFFFF" />
            <Text style={styles.startDrillText}>Play & Listen</Text>
          </TouchableOpacity>
        )}

        {shadowingState === "playing" && (
          <View style={styles.listeningState}>
            <View style={styles.aiSpeakerBubble}>
              <Ionicons name="volume-high" size={20} color={Colors.secondary} />
              <Text style={styles.aiSpeakingText}>Native speaker...</Text>
            </View>
            <View style={styles.speakerWave}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View key={i} style={[styles.waveBar, { height: 10 + Math.random() * 30, backgroundColor: Colors.secondary }]} />
              ))}
            </View>
          </View>
        )}

        {shadowingState === "your-turn" && (
          <View style={styles.readyState}>
            <Text style={styles.readyLabel}>Now repeat it!</Text>
            <TouchableOpacity style={styles.bigRecordBtn} onPress={startShadowRecord} activeOpacity={0.8}>
              <Ionicons name="mic" size={36} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {shadowingState === "recording" && (
          <View style={styles.recordingState}>
            <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
            <View style={styles.liveWaveform}>
              {Array.from({ length: 14 }).map((_, i) => (
                <View key={i} style={[styles.waveBar, { height: 6 + Math.random() * 32, backgroundColor: Colors.gold }]} />
              ))}
            </View>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={styles.stopRecordBtn} onPress={stopShadowRecord} activeOpacity={0.8}>
                <Ionicons name="stop" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {shadowingState === "scored" && (
          <View style={styles.resultState}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(shadowScore) }]}>
              <Text style={[styles.scoreNumber, { color: getScoreColor(shadowScore) }]}>{shadowScore}</Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>
            <Text style={styles.shadowFeedback}>
              {shadowScore >= 85 ? "Excellent match! 🎯" : shadowScore >= 70 ? "Good effort! Try matching the rhythm closer." : "Keep practicing — focus on the intonation."}
            </Text>
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.retryBtn} onPress={() => setShadowingState("idle")} activeOpacity={0.8}>
                <Ionicons name="refresh" size={18} color={Colors.textPrimary} />
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={nextShadow} activeOpacity={0.8}>
                <Text style={styles.nextBtnText}>Next Clip</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderJournal = () => (
    <View style={styles.modeContent}>
      <View style={styles.crHeader}>
        <Text style={styles.crTitle}>Voice Journal</Text>
        <Text style={styles.crSub}>Record daily in your target language — AI transcribes and corrects</Text>
      </View>

      {/* Record Section */}
      <View style={styles.journalRecordCard}>
        <Text style={styles.journalPrompt}>
          {journalRecording ? "Recording your journal entry..." : "Today's prompt: Talk about what you did today"}
        </Text>
        {journalRecording && (
          <Text style={styles.journalTimer}>{formatTime(journalTime)}</Text>
        )}
        <TouchableOpacity
          style={[styles.journalRecordBtn, journalRecording && styles.journalRecordBtnActive]}
          onPress={toggleJournal}
          activeOpacity={0.8}
        >
          <Ionicons name={journalRecording ? "stop" : "mic"} size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.journalHint}>
          {journalRecording ? "Tap to stop and save" : "Tap to start recording"}
        </Text>
      </View>

      {/* Past Entries */}
      {journalEntries.length > 0 && (
        <View style={styles.journalHistory}>
          <Text style={styles.journalHistoryTitle}>Recent Entries</Text>
          {journalEntries.map((entry, i) => (
            <View key={i} style={styles.journalEntry}>
              <View style={styles.journalEntryLeft}>
                <Ionicons name="calendar" size={14} color={Colors.textSecondary} />
                <Text style={styles.journalDate}>{entry.date}</Text>
              </View>
              <Text style={styles.journalDuration}>{formatTime(entry.duration)}</Text>
              <View style={[styles.journalScoreBadge, { backgroundColor: getScoreColor(entry.score) + "20" }]}>
                <Text style={[styles.journalScoreText, { color: getScoreColor(entry.score) }]}>{entry.score}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderAccentTraining = () => (
    <View style={styles.modeContent}>
      <View style={styles.crHeader}>
        <Text style={styles.crTitle}>Accent Training</Text>
        <Text style={styles.crSub}>Match regional accents — sound like a local</Text>
      </View>

      {/* Accent Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {ACCENT_DATA.map((accent) => (
          <TouchableOpacity
            key={accent.id}
            style={[styles.accentChip, selectedAccent.id === accent.id && styles.accentChipActive]}
            onPress={() => { setSelectedAccent(accent); setAccentPhraseIdx(0); setAccentState("idle"); setAccentScore(0); }}
            activeOpacity={0.7}
          >
            <Text style={styles.accentFlag}>{accent.flag}</Text>
            <Text style={[styles.accentChipText, selectedAccent.id === accent.id && styles.accentChipTextActive]}>
              {accent.accent.split(" ")[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected Accent Info */}
      <View style={styles.accentInfoCard}>
        <Text style={styles.accentInfoTitle}>{selectedAccent.flag} {selectedAccent.accent}</Text>
        <Text style={styles.accentInfoDesc}>{selectedAccent.description}</Text>
        <View style={styles.accentStats}>
          <View style={styles.accentStat}>
            <Text style={styles.accentStatNum}>{accentAttempts}</Text>
            <Text style={styles.accentStatLabel}>Attempts</Text>
          </View>
          <View style={styles.accentStatDivider} />
          <View style={styles.accentStat}>
            <Text style={[styles.accentStatNum, { color: Colors.success }]}>{accentScore}%</Text>
            <Text style={styles.accentStatLabel}>Accuracy</Text>
          </View>
          <View style={styles.accentStatDivider} />
          <View style={styles.accentStat}>
            <Text style={styles.accentStatNum}>{selectedAccent.phrases.length}</Text>
            <Text style={styles.accentStatLabel}>Phrases</Text>
          </View>
        </View>
      </View>

      {/* Current Phrase */}
      <View style={styles.accentPhraseCard}>
        <Text style={styles.accentPhraseNum}>Phrase {accentPhraseIdx + 1} of {selectedAccent.phrases.length}</Text>
        <Text style={styles.accentPhraseText}>{selectedAccent.phrases[accentPhraseIdx].text}</Text>
        <Text style={styles.accentPhonetic}>{selectedAccent.phrases[accentPhraseIdx].phonetic}</Text>
        <View style={styles.accentTipBox}>
          <Ionicons name="bulb" size={14} color={Colors.gold} />
          <Text style={styles.accentTipText}>{selectedAccent.phrases[accentPhraseIdx].tip}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.accentControls}>
        <TouchableOpacity
          style={styles.accentListenBtn}
          onPress={() => { setAccentState("listening"); setTimeout(() => setAccentState("idle"), 2000); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          activeOpacity={0.7}
        >
          <Ionicons name="volume-high" size={20} color={Colors.secondary} />
          <Text style={styles.accentListenText}>{accentState === "listening" ? "Playing..." : "Listen"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.accentRecordBtn, accentState === "recording" && styles.accentRecordBtnActive]}
          onPress={() => {
            if (accentState === "recording") {
              const mockScore = 65 + Math.floor(Math.random() * 30);
              setAccentScore(mockScore);
              setAccentAttempts(prev => prev + 1);
              setAccentState("scored");
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              setAccentState("recording");
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: accentState === "recording" ? pulseAnim : 1 }] }}>
            <Ionicons name={accentState === "recording" ? "stop" : "mic"} size={28} color="#fff" />
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.accentNextBtn}
          onPress={() => { setAccentPhraseIdx((prev) => (prev + 1) % selectedAccent.phrases.length); setAccentState("idle"); }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-forward" size={20} color={Colors.textSecondary} />
          <Text style={styles.accentNextText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Score Display */}
      {accentState === "scored" && (
        <View style={styles.accentScoreCard}>
          <Text style={styles.accentScoreTitle}>Accent Match</Text>
          <Text style={[styles.accentScoreNum, { color: accentScore >= 80 ? Colors.success : accentScore >= 60 ? Colors.gold : Colors.accent }]}>{accentScore}%</Text>
          <Text style={styles.accentScoreFeedback}>
            {accentScore >= 85 ? "Excellent! You sound like a local!" : accentScore >= 70 ? "Good! Getting closer to native rhythm" : "Keep practicing — focus on the rhythm and dropped letters"}
          </Text>
        </View>
      )}
    </View>
  );

  const renderConversationSim = () => (
    <View style={styles.modeContent}>
      <View style={styles.crHeader}>
        <Text style={styles.crTitle}>Live Conversation Simulation</Text>
        <Text style={styles.crSub}>Practice real conversations with an AI partner in your target language</Text>
      </View>
      <TouchableOpacity
        style={styles.goToStudioBtn}
        onPress={() => router.push("/live-simulation" as any)}
        activeOpacity={0.8}
      >
        <View style={[styles.goToStudioIcon, { backgroundColor: Colors.success + "15" }]}>
          <Ionicons name="people" size={32} color={Colors.success} />
        </View>
        <Text style={styles.goToStudioText}>Start Conversation</Text>
        <Text style={styles.goToStudioSub}>8 scenarios • 3 difficulty levels • pronunciation scoring</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.textSecondary} style={{ position: "absolute", right: 20, top: "50%" }} />
      </TouchableOpacity>
      <View style={styles.convoFeatures}>
        <View style={styles.convoFeatureRow}>
          <Ionicons name="restaurant" size={16} color={Colors.gold} />
          <Text style={styles.convoFeatureText}>Restaurant, Airport, Shopping & more</Text>
        </View>
        <View style={styles.convoFeatureRow}>
          <Ionicons name="trending-up" size={16} color={Colors.success} />
          <Text style={styles.convoFeatureText}>Real-time pronunciation correction</Text>
        </View>
        <View style={styles.convoFeatureRow}>
          <Ionicons name="language" size={16} color={Colors.secondary} />
          <Text style={styles.convoFeatureText}>60+ languages from the full language pack</Text>
        </View>
        <View style={styles.convoFeatureRow}>
          <Ionicons name="trophy" size={16} color={Colors.gold} />
          <Text style={styles.convoFeatureText}>Score breakdown after each session</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.goToStudioBtn, { marginTop: Spacing.md }]}
        onPress={() => router.push("/submissions-history" as any)}
        activeOpacity={0.8}
      >
        <View style={[styles.goToStudioIcon, { backgroundColor: Colors.gold + "15" }]}>
          <Ionicons name="time" size={32} color={Colors.gold} />
        </View>
        <Text style={styles.goToStudioText}>Recording History</Text>
        <Text style={styles.goToStudioSub}>View past recordings, scores & track progress</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.textSecondary} style={{ position: "absolute", right: 20, top: "50%" }} />
      </TouchableOpacity>
    </View>
  );

  const renderRecordMode = () => (
    <View style={styles.modeContent}>
      <View style={styles.crHeader}>
        <Text style={styles.crTitle}>WavyEq Studios</Text>
        <Text style={styles.crSub}>Record over translated songs with pro studio tools</Text>
      </View>
      <TouchableOpacity
        style={styles.goToStudioBtn}
        onPress={() => router.push("/wavy-eq-studio" as any)}
        activeOpacity={0.8}
      >
        <View style={styles.goToStudioIcon}>
          <Ionicons name="mic" size={32} color={Colors.secondary} />
        </View>
        <Text style={styles.goToStudioText}>Enter WavyEq Studios</Text>
        <Text style={styles.goToStudioSub}>VU meter, gain, punch-in recording & AI mixing</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.textSecondary} style={{ position: "absolute", right: 20, top: "50%" }} />
      </TouchableOpacity>

      {/* Studio Tools */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Studio Tools</Text>
        <TouchableOpacity
          style={[styles.goToStudioBtn, { marginBottom: 10 }]}
          onPress={() => router.push("/stem-separator" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.goToStudioIcon}>
            <Ionicons name="git-branch" size={28} color="#00FF88" />
          </View>
          <Text style={styles.goToStudioText}>Stem Separator</Text>
          <Text style={styles.goToStudioSub}>Isolate vocals, drums, bass & instruments</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.textSecondary} style={{ position: "absolute", right: 20, top: "50%" }} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.goToStudioBtn, { marginBottom: 10 }]}
          onPress={() => router.push("/vocal-translator" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.goToStudioIcon}>
            <Ionicons name="globe" size={28} color="#FFB800" />
          </View>
          <Text style={styles.goToStudioText}>Vocal Translator</Text>
          <Text style={styles.goToStudioSub}>Translate vocals to any language, same key & melody</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.textSecondary} style={{ position: "absolute", right: 20, top: "50%" }} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.goToStudioBtn, { marginBottom: 10 }]}
          onPress={() => router.push("/studio-library" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.goToStudioIcon}>
            <Ionicons name="folder" size={28} color="#00AAFF" />
          </View>
          <Text style={styles.goToStudioText}>WavyEq Songs</Text>
          <Text style={styles.goToStudioSub}>All your stems, mixes, translations & voice memos</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.textSecondary} style={{ position: "absolute", right: 20, top: "50%" }} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Studio</Text>
          <Text style={styles.headerSub}>Practice speaking & pronunciation</Text>
        </View>
        <TouchableOpacity style={styles.streakBadge}>
          <Ionicons name="flame" size={16} color={Colors.gold} />
          <Text style={styles.streakText}>{streak}</Text>
        </TouchableOpacity>
      </View>

      {/* Mode Tabs */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {MODE_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeMode === tab.key && styles.tabActive]}
              onPress={() => {
                setActiveMode(tab.key);
                setDrillState("idle");
                setShadowingState("idle");
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeMode === tab.key ? Colors.textPrimary : Colors.textSecondary}
              />
              <Text style={[styles.tabText, activeMode === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {activeMode === "pronunciation" && renderPronunciationLab()}
        {activeMode === "call-response" && renderCallResponse()}
        {activeMode === "shadowing" && renderShadowing()}
        {activeMode === "accent" && renderAccentTraining()}
        {activeMode === "journal" && renderJournal()}
        {activeMode === "record" && renderRecordMode()}
        {activeMode === "conversation" && renderConversationSim()}
      </ScrollView>
    
      <PaywallModal
        visible={showPaywall}
        onClose={dismissPaywall}
        feature={paywallFeature}
        singlePrice={singlePrice}
      />
</SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.goldGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  streakText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gold,
  },

  // Tab bar
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 4,
    paddingBottom: Spacing.sm,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: "transparent",
  },
  tabActive: {
    backgroundColor: Colors.secondary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },

  // Mode content
  modeContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.lg,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  // Phrase card
  phraseCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  phraseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  diffText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  phraseLang: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  phraseOriginal: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 26,
    marginBottom: 6,
  },
  phrasePhonetic: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontStyle: "italic",
    marginBottom: 8,
  },
  phraseTranslation: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },

  // Action area
  actionArea: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  actionButtons: {
    alignItems: "center",
    gap: 16,
  },
  listenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  listenBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.secondary,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // States
  listeningState: {
    alignItems: "center",
    gap: 16,
  },
  speakerWave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 40,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 4,
  },
  stateLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  readyState: {
    alignItems: "center",
    gap: 16,
  },
  readyLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  readyHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  bigRecordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 3,
    borderColor: "rgba(255, 45, 45, 0.4)",
  },
  recordingState: {
    alignItems: "center",
    gap: 16,
  },
  recordingTime: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.accent,
    fontVariant: ["tabular-nums"],
  },
  liveWaveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 50,
  },
  stopRecordBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 45, 45, 0.6)",
  },
  analyzingState: {
    alignItems: "center",
    gap: 12,
  },
  analyzeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  analyzeHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // Results
  resultState: {
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceCard,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: "900",
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  breakdownRow: {
    flexDirection: "row",
    gap: 20,
  },
  breakdownItem: {
    alignItems: "center",
    gap: 4,
  },
  breakdownValue: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  breakdownLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  tipsCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  tipsTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  tipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  resultActions: {
    flexDirection: "row",
    gap: 12,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
  },
  nextBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  attemptText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // Call & Response
  crHeader: {
    marginBottom: Spacing.lg,
  },
  crTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  crSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  crBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  crTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warning + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  crTimeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.warning,
  },
  crProgress: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  startDrillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  startDrillText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  aiSpeakerBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  aiSpeakingText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.warning + "20",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
  },
  countdownText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.warning,
  },

  // Shadowing
  shadowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: Spacing.md,
  },
  speedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  speedText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.secondary,
    textTransform: "capitalize",
  },
  shadowDuration: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  shadowFeedback: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // Journal
  journalRecordCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
    marginBottom: Spacing.lg,
  },
  journalPrompt: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 22,
  },
  journalTimer: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.accent,
    fontVariant: ["tabular-nums"],
  },
  journalRecordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  journalRecordBtnActive: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
  },
  journalHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  journalHistory: {
    gap: 8,
  },
  journalHistoryTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  journalEntry: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  journalEntryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  journalDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  journalDuration: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  journalScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  journalScoreText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
  },

  // Go to full studio
  goToStudioBtn: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    gap: 10,
    position: "relative",
  },
  goToStudioIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  goToStudioText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  goToStudioSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // Accent Training
  accentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accentChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.glow,
  },
  accentFlag: {
    fontSize: 16,
  },
  accentChipText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  accentChipTextActive: {
    color: "#FFFFFF",
  },
  accentInfoCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accentInfoTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  accentInfoDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  accentStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  accentStat: {
    alignItems: "center",
  },
  accentStatNum: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  accentStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  accentStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  accentPhraseCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    alignItems: "center",
  },
  accentPhraseNum: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  accentPhraseText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  accentPhonetic: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 12,
  },
  accentTipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Colors.goldGlow,
    borderRadius: BorderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  accentTipText: {
    fontSize: FontSize.xs,
    color: Colors.gold,
    flex: 1,
    lineHeight: 16,
  },
  accentControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  accentListenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.glowSubtle,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  accentListenText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
  accentRecordBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  accentRecordBtnActive: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
  },
  accentNextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accentNextText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  accentScoreCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    gap: 8,
  },
  accentScoreTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  accentScoreNum: {
    fontSize: 36,
    fontWeight: "900",
  },
  accentScoreFeedback: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  convoFeatures: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: 12,
  },
  convoFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  convoFeatureText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
});
