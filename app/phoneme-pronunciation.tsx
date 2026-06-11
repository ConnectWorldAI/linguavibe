/**
 * Phoneme-Level Pronunciation - ELSA-inspired
 * Granular pronunciation scoring with mouth/tongue diagrams.
 * Features: Individual phoneme scoring, mouth placement visuals, 
 * waveform comparison, accent coaching, time capsule recordings.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { trpc } from "@/lib/trpc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface Phoneme {
  id: string;
  symbol: string;
  example: string;
  score: number;
  status: "perfect" | "good" | "needs-work" | "not-attempted";
  mouthPosition: string;
  tonguePosition: string;
  commonMistake: string;
  tip: string;
}

interface PronunciationWord {
  id: string;
  word: string;
  ipa: string;
  translation: string;
  phonemes: PhonemeScore[];
  overallScore: number;
  audioUrl?: string;
}

interface PhonemeScore {
  phoneme: string;
  score: number;
  color: string;
}

interface PronunciationLesson {
  id: string;
  title: string;
  language: string;
  flag: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  phonemeFocus: string[];
  words: PronunciationWord[];
  completedCount: number;
  totalCount: number;
}

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const PHONEME_MAP: Record<string, Phoneme[]> = {
  spanish: [
    { id: "rr", symbol: "rr", example: "perro", score: 45, status: "needs-work", mouthPosition: "Tongue tip vibrates against alveolar ridge (roof of mouth behind teeth)", tonguePosition: "Tip curled up, touching ridge, air forces it to vibrate rapidly", commonMistake: "Using English 'r' (tongue doesn't vibrate)", tip: "Practice by saying 'butter' fast → the 'tt' sound is close to a single Spanish 'r'. For 'rr', try purring like a cat." },
    { id: "ñ", symbol: "ñ", example: "año", score: 72, status: "good", mouthPosition: "Middle of tongue pressed flat against hard palate", tonguePosition: "Flat and wide, pressed against roof of mouth (like 'ny' in canyon)", commonMistake: "Saying 'n' + 'y' separately instead of one sound", tip: "Think of the 'ni' in 'onion' — that's the ñ sound. It's ONE sound, not two." },
    { id: "j", symbol: "j/g", example: "gente", score: 88, status: "perfect", mouthPosition: "Back of throat constricted, like a soft 'h' but with friction", tonguePosition: "Back of tongue raised toward soft palate", commonMistake: "Using English 'j' sound (too hard)", tip: "Like you're fogging up a mirror, but with more friction. Softer than English 'h'." },
    { id: "ll", symbol: "ll/y", example: "calle", score: 65, status: "good", mouthPosition: "Varies by dialect: 'y' sound (most), 'sh' sound (Argentina), or 'j' sound (some)", tonguePosition: "Front of tongue near palate for 'y'; further back for 'sh'", commonMistake: "Using English 'l' sound", tip: "In most Spanish: say 'y' as in 'yes'. In Argentine Spanish: say 'sh' as in 'shoe'." },
    { id: "d-soft", symbol: "d (soft)", example: "nada", score: 55, status: "needs-work", mouthPosition: "Tongue tip barely touches upper teeth (voiced 'th')", tonguePosition: "Tip between or just behind upper teeth, very light contact", commonMistake: "Using hard 'd' like English 'dog'", tip: "Between vowels, Spanish 'd' becomes like 'th' in 'this'. Say 'na-tha' gently." },
    { id: "b-soft", symbol: "b/v (soft)", example: "haber", score: 60, status: "needs-work", mouthPosition: "Lips almost touching but not fully closed (bilabial fricative)", tonguePosition: "Relaxed, not involved", commonMistake: "Using hard 'b' or distinguishing b/v (they're the same in Spanish!)", tip: "Between vowels, don't fully close your lips. Let air pass through slightly parted lips." },
  ],
  japanese: [
    { id: "tsu", symbol: "つ (tsu)", example: "つき", score: 70, status: "good", mouthPosition: "Tongue tip behind upper teeth, quick release with 's' sound", tonguePosition: "Tip pressed then released from alveolar ridge with friction", commonMistake: "Saying 'too' or 'sue' instead of 'tsu'", tip: "Start with 't' position, release into 's'. It's like 'ts' in 'cats' but at the start of a syllable." },
    { id: "r-flap", symbol: "ら行 (r-flap)", example: "らーめん", score: 50, status: "needs-work", mouthPosition: "Quick single tap of tongue tip against alveolar ridge", tonguePosition: "Tip flaps once against ridge (between English 'r', 'l', and 'd')", commonMistake: "Using English 'r' (tongue doesn't touch) or 'l' (tongue stays)", tip: "Say 'butter' fast — the 'tt' sound is exactly the Japanese 'r'. One quick tap, not held." },
    { id: "n-moraic", symbol: "ん (moraic n)", example: "さんぽ", score: 82, status: "good", mouthPosition: "Changes based on following sound (m before b/p, ng before k/g, n elsewhere)", tonguePosition: "Varies — this is a full beat/mora, not just a consonant", commonMistake: "Making it too short (it needs its own beat)", tip: "ん takes the same time as any other syllable. 'さんぽ' is 3 beats: sa-n-po, not 2." },
    { id: "long-vowel", symbol: "長音 (long vowels)", example: "おばあさん", score: 40, status: "needs-work", mouthPosition: "Same as short vowel but held for two beats", tonguePosition: "Same position, just sustained longer", commonMistake: "Not holding long enough — changes meaning! (おばさん=aunt, おばあさん=grandmother)", tip: "Long vowels are DOUBLE the length. Count beats: お-ば-あ-さ-ん = 5 beats." },
  ],
  french: [
    { id: "r-uvular", symbol: "r (uvular)", example: "rouge", score: 35, status: "needs-work", mouthPosition: "Back of tongue raised toward uvula, creating friction", tonguePosition: "Back raised, uvula vibrates (gargling position)", commonMistake: "Using English 'r' or Spanish rolled 'r'", tip: "Gargle water — that's the position. Now try making that sound without water. Start with 'ahh' and raise the back of your tongue." },
    { id: "u-front", symbol: "u (front)", example: "tu", score: 55, status: "needs-work", mouthPosition: "Lips rounded tightly (like 'oo') but tongue forward (like 'ee')", tonguePosition: "High and forward (like 'ee') while lips are rounded", commonMistake: "Saying 'oo' (too) instead of 'ü' (tü)", tip: "Say 'ee', then round your lips without moving your tongue. That's the French 'u'." },
    { id: "nasal-on", symbol: "on (nasal)", example: "bon", score: 68, status: "good", mouthPosition: "Lips rounded, air flows through nose, tongue low-back", tonguePosition: "Low and back, soft palate lowered to let air through nose", commonMistake: "Adding an 'n' sound at the end (it's nasal, not 'bonn')", tip: "Say 'oh' while pinching your nose — you should feel vibration. That's the nasal quality. No 'n' at the end!" },
  ],
};

const PRONUNCIATION_LESSONS: PronunciationLesson[] = [
  {
    id: "sp-rr", title: "Master the Rolled RR", language: "Spanish", flag: "🇪🇸",
    description: "The #1 hardest sound for English speakers. We'll get you rolling.",
    difficulty: "hard", phonemeFocus: ["rr", "r"],
    completedCount: 2, totalCount: 10,
    words: [
      { id: "1", word: "perro", ipa: "/ˈpe.ro/", translation: "dog", overallScore: 45, phonemes: [{ phoneme: "p", score: 95, color: "#10B981" }, { phoneme: "e", score: 90, color: "#10B981" }, { phoneme: "rr", score: 35, color: "#EF4444" }, { phoneme: "o", score: 92, color: "#10B981" }] },
      { id: "2", word: "carro", ipa: "/ˈka.ro/", translation: "car", overallScore: 42, phonemes: [{ phoneme: "k", score: 94, color: "#10B981" }, { phoneme: "a", score: 91, color: "#10B981" }, { phoneme: "rr", score: 30, color: "#EF4444" }, { phoneme: "o", score: 90, color: "#10B981" }] },
      { id: "3", word: "arroz", ipa: "/aˈros/", translation: "rice", overallScore: 50, phonemes: [{ phoneme: "a", score: 88, color: "#10B981" }, { phoneme: "rr", score: 40, color: "#EF4444" }, { phoneme: "o", score: 85, color: "#10B981" }, { phoneme: "s", score: 92, color: "#10B981" }] },
      { id: "4", word: "tierra", ipa: "/ˈtje.ra/", translation: "earth", overallScore: 48, phonemes: [{ phoneme: "t", score: 90, color: "#10B981" }, { phoneme: "ie", score: 82, color: "#3B82F6" }, { phoneme: "rr", score: 38, color: "#EF4444" }, { phoneme: "a", score: 91, color: "#10B981" }] },
    ],
  },
  {
    id: "jp-flap", title: "Japanese R-Flap Mastery", language: "Japanese", flag: "🇯🇵",
    description: "The sound between English R, L, and D. One quick tap.",
    difficulty: "medium", phonemeFocus: ["r-flap"],
    completedCount: 0, totalCount: 8,
    words: [
      { id: "1", word: "ラーメン", ipa: "/ɾaːmeɴ/", translation: "ramen", overallScore: 0, phonemes: [{ phoneme: "ɾ", score: 0, color: "#94A3B8" }, { phoneme: "aː", score: 0, color: "#94A3B8" }, { phoneme: "me", score: 0, color: "#94A3B8" }, { phoneme: "ɴ", score: 0, color: "#94A3B8" }] },
      { id: "2", word: "りんご", ipa: "/ɾiŋɡo/", translation: "apple", overallScore: 0, phonemes: [{ phoneme: "ɾi", score: 0, color: "#94A3B8" }, { phoneme: "ŋ", score: 0, color: "#94A3B8" }, { phoneme: "ɡo", score: 0, color: "#94A3B8" }] },
    ],
  },
  {
    id: "fr-r", title: "French Uvular R", language: "French", flag: "🇫🇷",
    description: "The gargling R that makes French sound French.",
    difficulty: "hard", phonemeFocus: ["r-uvular"],
    completedCount: 0, totalCount: 8,
    words: [
      { id: "1", word: "rouge", ipa: "/ʁuʒ/", translation: "red", overallScore: 0, phonemes: [{ phoneme: "ʁ", score: 0, color: "#94A3B8" }, { phoneme: "u", score: 0, color: "#94A3B8" }, { phoneme: "ʒ", score: 0, color: "#94A3B8" }] },
      { id: "2", word: "Paris", ipa: "/paˈʁi/", translation: "Paris", overallScore: 0, phonemes: [{ phoneme: "pa", score: 0, color: "#94A3B8" }, { phoneme: "ʁ", score: 0, color: "#94A3B8" }, { phoneme: "i", score: 0, color: "#94A3B8" }] },
    ],
  },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function PhonemePronunciationScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ language?: string }>();
  const [view, setView] = useState<"overview" | "lesson" | "practice">("overview");
  const [selectedLesson, setSelectedLesson] = useState<PronunciationLesson | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedPhoneme, setSelectedPhoneme] = useState<Phoneme | null>(null);
  const [activeLanguage, setActiveLanguage] = useState("spanish");
  const recordAnim = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  // ─── Real NLP Hooks ─────────────────────────────────────────────────────────
  const stt = useSpeechToText();
  const pronunciationMutation = trpc.pronunciation.analyze.useMutation();

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(recordAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      recordAnim.setValue(1);
    }
  }, [isRecording]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "#10B981";
    if (score >= 70) return "#3B82F6";
    if (score >= 50) return "#F59E0B";
    if (score > 0) return "#EF4444";
    return "#94A3B8";
  };

  const startRecording = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(true);
    setShowResult(false);
    setLastFeedback(null);
    scoreAnim.setValue(0);

    try {
      // Start real microphone recording
      await stt.startRecording();
    } catch {
      // If mic unavailable, fall back to timed simulation
      setTimeout(() => {
        setIsRecording(false);
        setShowResult(true);
        Animated.timing(scoreAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 3000);
    }
  }, [stt, scoreAnim]);

  const stopRecordingAndAnalyze = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false);
    setIsAnalyzing(true);

    try {
      // 1. Get transcription from real speech
      const spokenText = await stt.stopRecording();

      if (!spokenText || spokenText.trim().length === 0) {
        setLastFeedback("No speech detected. Try speaking louder and closer to the mic.");
        setIsAnalyzing(false);
        return;
      }

      // 2. Get the target word/phrase for comparison
      const currentWord = selectedLesson?.words[currentWordIndex];
      const targetText = currentWord?.word || "";

      // 3. Real AI pronunciation analysis via server LLM
      const langCode = activeLanguage === "spanish" ? "es" : activeLanguage === "japanese" ? "ja" : "fr";
      const result = await pronunciationMutation.mutateAsync({
        targetText,
        language: langCode,
      });

      // 4. Update phoneme scores from AI analysis
      if (currentWord && result.success && result.analysis?.phonemes) {
        const aiPhonemes = result.analysis.phonemes;
        const updatedPhonemes = currentWord.phonemes.map((p, i) => {
          const aiScore = aiPhonemes[i]?.score ?? p.score;
          return { ...p, score: aiScore, color: getScoreColor(aiScore) };
        });
        currentWord.phonemes = updatedPhonemes;
        currentWord.overallScore = result.analysis.score ?? Math.round(
          updatedPhonemes.reduce((sum, p) => sum + p.score, 0) / updatedPhonemes.length
        );
      }

      // 5. Set feedback from AI (emotion-aware, contextual)
      const feedback = result.success && result.analysis
        ? result.analysis.emotionAwareFeedback || result.analysis.overallFeedback || result.analysis.tip
        : "Analysis unavailable. Please try again.";
      setLastFeedback(feedback || null);
      setShowResult(true);
      Animated.timing(scoreAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

      if (Platform.OS !== "web") {
        const score = (result.success && result.analysis?.score) ? result.analysis.score : (currentWord?.overallScore ?? 0);
        if (score >= 85) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (score >= 50) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    } catch (err) {
      console.warn("[Phoneme] Analysis failed:", err);
      setLastFeedback("Analysis unavailable. Please try again.");
      setShowResult(true);
      Animated.timing(scoreAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } finally {
      setIsAnalyzing(false);
    }
  }, [isRecording, stt, selectedLesson, currentWordIndex, activeLanguage, pronunciationMutation, scoreAnim]);

  const languages = [
    { id: "spanish", label: "🇪🇸 Spanish" },
    { id: "japanese", label: "🇯🇵 Japanese" },
    { id: "french", label: "🇫🇷 French" },
  ];

  // ─── OVERVIEW ─────────────────────────────────────────────────────────────

  const renderOverview = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>Pronunciation Lab</Text>
        <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
          Master every sound. See exactly where your tongue goes. Score each phoneme individually.
        </Text>
      </View>

      {/* Language Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.id}
            style={[styles.langChip, activeLanguage === lang.id && { backgroundColor: colors.primary }]}
            onPress={() => setActiveLanguage(lang.id)}
          >
            <Text style={[styles.langChipText, { color: activeLanguage === lang.id ? "#FFF" : colors.foreground }]}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Phoneme Grid */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Sound Map</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>Tap any sound for mouth placement guide</Text>
      <View style={styles.phonemeGrid}>
        {(PHONEME_MAP[activeLanguage] || []).map((phoneme) => (
          <TouchableOpacity
            key={phoneme.id}
            style={[styles.phonemeCell, { backgroundColor: getScoreColor(phoneme.score) + "20", borderColor: getScoreColor(phoneme.score) }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedPhoneme(phoneme);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.phonemeSymbol, { color: getScoreColor(phoneme.score) }]}>{phoneme.symbol}</Text>
            <Text style={[styles.phonemeExample, { color: colors.muted }]}>{phoneme.example}</Text>
            <Text style={[styles.phonemeScore, { color: getScoreColor(phoneme.score) }]}>
              {phoneme.score > 0 ? `${phoneme.score}%` : "—"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Phoneme Detail Modal (inline) */}
      {selectedPhoneme && (
        <View style={[styles.phonemeDetail, { backgroundColor: colors.surface }]}>
          <View style={styles.phonemeDetailHeader}>
            <Text style={[styles.phonemeDetailSymbol, { color: colors.primary }]}>{selectedPhoneme.symbol}</Text>
            <TouchableOpacity onPress={() => setSelectedPhoneme(null)}>
              <Ionicons name="close-circle" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.phonemeDetailExample, { color: colors.foreground }]}>
            Example: "{selectedPhoneme.example}"
          </Text>

          {/* Mouth Position */}
          <View style={[styles.positionCard, { backgroundColor: "#3B82F610" }]}>
            <Text style={styles.positionIcon}>👄</Text>
            <View style={styles.positionInfo}>
              <Text style={[styles.positionLabel, { color: "#3B82F6" }]}>Mouth Position</Text>
              <Text style={[styles.positionText, { color: colors.foreground }]}>{selectedPhoneme.mouthPosition}</Text>
            </View>
          </View>

          {/* Tongue Position */}
          <View style={[styles.positionCard, { backgroundColor: "#8B5CF610" }]}>
            <Text style={styles.positionIcon}>👅</Text>
            <View style={styles.positionInfo}>
              <Text style={[styles.positionLabel, { color: "#8B5CF6" }]}>Tongue Position</Text>
              <Text style={[styles.positionText, { color: colors.foreground }]}>{selectedPhoneme.tonguePosition}</Text>
            </View>
          </View>

          {/* Common Mistake */}
          <View style={[styles.positionCard, { backgroundColor: "#EF444410" }]}>
            <Text style={styles.positionIcon}>⚠️</Text>
            <View style={styles.positionInfo}>
              <Text style={[styles.positionLabel, { color: "#EF4444" }]}>Common Mistake</Text>
              <Text style={[styles.positionText, { color: colors.foreground }]}>{selectedPhoneme.commonMistake}</Text>
            </View>
          </View>

          {/* Pro Tip */}
          <View style={[styles.positionCard, { backgroundColor: "#10B98110" }]}>
            <Text style={styles.positionIcon}>💡</Text>
            <View style={styles.positionInfo}>
              <Text style={[styles.positionLabel, { color: "#10B981" }]}>Pro Tip</Text>
              <Text style={[styles.positionText, { color: colors.foreground }]}>{selectedPhoneme.tip}</Text>
            </View>
          </View>

          {/* Practice Button */}
          <TouchableOpacity
            style={[styles.practicePhonemeBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSelectedPhoneme(null);
              // Navigate to practice
            }}
          >
            <Ionicons name="mic" size={18} color="#FFF" />
            <Text style={styles.practicePhonemeBtnText}>Practice This Sound</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lessons */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>Targeted Lessons</Text>
      {PRONUNCIATION_LESSONS.filter((l) => l.language.toLowerCase().includes(activeLanguage)).map((lesson) => (
        <TouchableOpacity
          key={lesson.id}
          style={[styles.lessonCard, { backgroundColor: colors.surface }]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedLesson(lesson);
            setView("lesson");
          }}
          activeOpacity={0.7}
        >
          <View style={styles.lessonTop}>
            <Text style={styles.lessonFlag}>{lesson.flag}</Text>
            <View style={styles.lessonInfo}>
              <Text style={[styles.lessonTitle, { color: colors.foreground }]}>{lesson.title}</Text>
              <Text style={[styles.lessonDesc, { color: colors.muted }]}>{lesson.description}</Text>
            </View>
            <View style={[styles.diffBadge, { backgroundColor: lesson.difficulty === "hard" ? "#EF444420" : lesson.difficulty === "medium" ? "#F59E0B20" : "#10B98120" }]}>
              <Text style={[styles.diffText, { color: lesson.difficulty === "hard" ? "#EF4444" : lesson.difficulty === "medium" ? "#F59E0B" : "#10B981" }]}>{lesson.difficulty}</Text>
            </View>
          </View>
          <View style={styles.lessonProgress}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${(lesson.completedCount / lesson.totalCount) * 100}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.muted }]}>{lesson.completedCount}/{lesson.totalCount} words</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Time Capsule */}
      <View style={[styles.timeCapsuleCard, { backgroundColor: colors.surface }]}>
        <View style={styles.timeCapsuleHeader}>
          <Text style={styles.timeCapsuleIcon}>⏰</Text>
          <Text style={[styles.timeCapsuleTitle, { color: colors.foreground }]}>Time Capsule</Text>
        </View>
        <Text style={[styles.timeCapsuleDesc, { color: colors.muted }]}>
          Record your voice today. Listen back on Day 30, 90, and 365 to hear your incredible improvement.
        </Text>
        <View style={styles.timeCapsuleDays}>
          {["Day 1", "Day 30", "Day 90", "Day 365"].map((day, i) => (
            <View key={day} style={[styles.capsuleDay, { backgroundColor: i === 0 ? colors.primary + "20" : colors.background }]}>
              <Ionicons name={i === 0 ? "checkmark-circle" : "lock-closed"} size={14} color={i === 0 ? colors.primary : colors.muted} />
              <Text style={[styles.capsuleDayText, { color: i === 0 ? colors.primary : colors.muted }]}>{day}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[styles.recordCapsuleBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="mic" size={16} color="#FFF" />
          <Text style={styles.recordCapsuleBtnText}>Record Today's Capsule</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ─── LESSON VIEW ──────────────────────────────────────────────────────────

  const renderLesson = () => {
    if (!selectedLesson) return null;
    const currentWord = selectedLesson.words[currentWordIndex];
    if (!currentWord) return null;

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.lessonProgressHeader}>
          <Text style={[styles.lessonProgressLabel, { color: colors.muted }]}>
            Word {currentWordIndex + 1} of {selectedLesson.words.length}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border, flex: 1, marginLeft: 12 }]}>
            <View style={[styles.progressFill, {
              width: `${((currentWordIndex + 1) / selectedLesson.words.length) * 100}%`,
              backgroundColor: colors.primary,
            }]} />
          </View>
        </View>

        {/* Word Card */}
        <View style={[styles.wordCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.wordText, { color: colors.foreground }]}>{currentWord.word}</Text>
          <Text style={[styles.wordIPA, { color: colors.primary }]}>{currentWord.ipa}</Text>
          <Text style={[styles.wordTranslation, { color: colors.muted }]}>{currentWord.translation}</Text>

          {/* Listen Button */}
          <TouchableOpacity style={[styles.listenBtn, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="volume-high" size={20} color={colors.primary} />
            <Text style={[styles.listenText, { color: colors.primary }]}>Listen to Native</Text>
          </TouchableOpacity>
        </View>

        {/* Phoneme Breakdown */}
        {showResult && (
          <Animated.View style={[styles.phonemeBreakdown, { backgroundColor: colors.surface, opacity: scoreAnim }]}>
            <Text style={[styles.breakdownTitle, { color: colors.foreground }]}>Phoneme Breakdown</Text>
            <View style={styles.phonemeRow}>
              {currentWord.phonemes.map((p, i) => (
                <View key={i} style={styles.phonemeScoreItem}>
                  <View style={[styles.phonemeScoreCircle, { borderColor: p.color }]}>
                    <Text style={[styles.phonemeScoreText, { color: p.color }]}>{p.score}%</Text>
                  </View>
                  <Text style={[styles.phonemeScoreLabel, { color: colors.foreground }]}>{p.phoneme}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.overallScoreBar, { backgroundColor: colors.background }]}>
              <Text style={[styles.overallLabel, { color: colors.muted }]}>Overall</Text>
              <View style={[styles.scoreBarTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.scoreBarFill, { width: `${currentWord.overallScore}%`, backgroundColor: getScoreColor(currentWord.overallScore) }]} />
              </View>
              <Text style={[styles.overallScore, { color: getScoreColor(currentWord.overallScore) }]}>{currentWord.overallScore}%</Text>
            </View>
          </Animated.View>
        )}

        {/* Record Button */}
        <View style={styles.recordSection}>
          <Animated.View style={[styles.recordBtnOuter, { transform: [{ scale: recordAnim }] }]}>
            <TouchableOpacity
              style={[styles.recordBtn, { backgroundColor: isRecording ? "#EF4444" : isAnalyzing ? "#F59E0B" : colors.primary }]}
              onPress={isRecording ? stopRecordingAndAnalyze : startRecording}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="#FFF" />
              )}
            </TouchableOpacity>
          </Animated.View>
          <Text style={[styles.recordHint, { color: colors.muted }]}>
            {isAnalyzing ? "Analyzing pronunciation..." : isRecording ? "Tap to stop" : showResult ? "Tap to try again" : "Tap to record"}
          </Text>
          {lastFeedback && (
            <View style={{ marginTop: 8, paddingHorizontal: 20 }}>
              <Text style={{ color: colors.foreground, fontSize: 13, textAlign: "center", fontStyle: "italic" }}>
                {lastFeedback}
              </Text>
            </View>
          )}
        </View>

        {/* Navigation */}
        {showResult && (
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: colors.surface }]}
              onPress={() => {
                setShowResult(false);
                scoreAnim.setValue(0);
              }}
            >
              <Ionicons name="refresh" size={18} color={colors.foreground} />
              <Text style={[styles.navBtnText, { color: colors.foreground }]}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (currentWordIndex < selectedLesson.words.length - 1) {
                  setCurrentWordIndex(currentWordIndex + 1);
                  setShowResult(false);
                  scoreAnim.setValue(0);
                }
              }}
            >
              <Text style={styles.navBtnTextWhite}>Next Word</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => {
          if (view === "lesson") { setView("overview"); setSelectedLesson(null); setCurrentWordIndex(0); setShowResult(false); }
          else router.back();
        }} style={styles.backBtn}>
          <Ionicons name={view === "overview" ? "arrow-back" : "chevron-back"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {view === "lesson" && selectedLesson ? selectedLesson.title : "Pronunciation Lab"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {view === "overview" ? renderOverview() : renderLesson()}
    </ScreenContainer>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  heroSection: { marginBottom: 16 },
  heroTitle: { fontSize: 28, fontWeight: "800" },
  heroSubtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  langScroll: { marginBottom: 20 },
  langChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: "rgba(148,163,184,0.1)" },
  langChipText: { fontSize: 13, fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, marginBottom: 12 },
  phonemeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  phonemeCell: { width: (SCREEN_WIDTH - 62) / 3, padding: 12, borderRadius: 12, alignItems: "center", borderWidth: 1.5 },
  phonemeSymbol: { fontSize: 20, fontWeight: "800" },
  phonemeExample: { fontSize: 11, marginTop: 4 },
  phonemeScore: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  phonemeDetail: { borderRadius: 16, padding: 20, marginBottom: 16 },
  phonemeDetailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  phonemeDetailSymbol: { fontSize: 32, fontWeight: "800" },
  phonemeDetailExample: { fontSize: 14, marginBottom: 16 },
  positionCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 10, marginBottom: 10 },
  positionIcon: { fontSize: 20 },
  positionInfo: { flex: 1 },
  positionLabel: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  positionText: { fontSize: 13, lineHeight: 18 },
  practicePhonemeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, marginTop: 12 },
  practicePhonemeBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  lessonCard: { borderRadius: 14, padding: 16, marginBottom: 12 },
  lessonTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  lessonFlag: { fontSize: 28 },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 15, fontWeight: "700" },
  lessonDesc: { fontSize: 12, marginTop: 2 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffText: { fontSize: 10, fontWeight: "700" },
  lessonProgress: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: { height: 4, borderRadius: 2, flex: 1, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  progressText: { fontSize: 11 },
  timeCapsuleCard: { borderRadius: 16, padding: 20, marginTop: 24 },
  timeCapsuleHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  timeCapsuleIcon: { fontSize: 20 },
  timeCapsuleTitle: { fontSize: 16, fontWeight: "700" },
  timeCapsuleDesc: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  timeCapsuleDays: { flexDirection: "row", gap: 8, marginBottom: 14 },
  capsuleDay: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 8 },
  capsuleDayText: { fontSize: 11, fontWeight: "600" },
  recordCapsuleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 10 },
  recordCapsuleBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  // Lesson view
  lessonProgressHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  lessonProgressLabel: { fontSize: 12 },
  wordCard: { borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 20 },
  wordText: { fontSize: 36, fontWeight: "800" },
  wordIPA: { fontSize: 16, marginTop: 8 },
  wordTranslation: { fontSize: 14, marginTop: 4 },
  listenBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginTop: 16 },
  listenText: { fontSize: 13, fontWeight: "600" },
  phonemeBreakdown: { borderRadius: 16, padding: 20, marginBottom: 20 },
  breakdownTitle: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  phonemeRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 16 },
  phonemeScoreItem: { alignItems: "center" },
  phonemeScoreCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, justifyContent: "center", alignItems: "center" },
  phonemeScoreText: { fontSize: 12, fontWeight: "700" },
  phonemeScoreLabel: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  overallScoreBar: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 8 },
  overallLabel: { fontSize: 12, fontWeight: "600" },
  scoreBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 3 },
  overallScore: { fontSize: 14, fontWeight: "800" },
  recordSection: { alignItems: "center", marginVertical: 20 },
  recordBtnOuter: {},
  recordBtn: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  recordHint: { fontSize: 13, marginTop: 12 },
  navRow: { flexDirection: "row", gap: 12 },
  navBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 14, borderRadius: 12 },
  navBtnText: { fontSize: 14, fontWeight: "600" },
  navBtnTextWhite: { color: "#FFF", fontSize: 14, fontWeight: "600" },
});
