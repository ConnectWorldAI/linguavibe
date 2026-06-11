/**
 * Dialect Challenge Screen
 *
 * BilingueBlogs-inspired game where users identify which Spanish dialect
 * a phrase belongs to. Features offline-ready content, timed rounds,
 * audio pronunciation, and teaching moments explaining dialect differences.
 *
 * Inspired by @bilingueblogs' multi-dialect exposure teaching style.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated as RNAnimated,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChallengePhrase {
  id: string;
  phrase: string;
  meaning: string;
  correctDialect: string;
  correctFlag: string;
  pronunciation?: string;
  teachingMoment: string; // BilingueBlogs-style explanation
  audioHint: string; // What to listen for
  category: "slang" | "greeting" | "expression" | "pronunciation" | "grammar";
}

interface DialectChoice {
  name: string;
  flag: string;
}

interface ChallengeRound {
  phrase: ChallengePhrase;
  choices: DialectChoice[];
  timeLimit: number; // seconds
}

interface ChallengeStats {
  totalPlayed: number;
  totalCorrect: number;
  bestStreak: number;
  bestTime: number; // fastest correct answer in ms
  dialectsMastered: string[]; // dialects with >80% accuracy
  lastPlayed: string;
}

// ─── Challenge Content (Offline-Ready) ──────────────────────────────────────

const DIALECT_CHOICES: DialectChoice[] = [
  { name: "Dominican", flag: "🇩🇴" },
  { name: "Mexican", flag: "🇲🇽" },
  { name: "Colombian", flag: "🇨🇴" },
  { name: "Puerto Rican", flag: "🇵🇷" },
  { name: "Venezuelan", flag: "🇻🇪" },
  { name: "Cuban", flag: "🇨🇺" },
  { name: "Argentine", flag: "🇦🇷" },
];

const CHALLENGE_PHRASES: ChallengePhrase[] = [
  // Dominican
  {
    id: "do1",
    phrase: "¿Qué lo que?",
    meaning: "What's up? / What's going on?",
    correctDialect: "Dominican",
    correctFlag: "🇩🇴",
    pronunciation: "keh-loh-keh",
    teachingMoment: "Dominicans shorten everything! This is their signature greeting — you'll hear it on every street corner in Santo Domingo. It's like saying 'what's the deal?' but faster.",
    audioHint: "Listen for the dropped 's' sounds and rapid pace",
    category: "greeting",
  },
  {
    id: "do2",
    phrase: "Tá to'",
    meaning: "Everything is fine / It's all good",
    correctDialect: "Dominican",
    correctFlag: "🇩🇴",
    pronunciation: "tah-toh",
    teachingMoment: "Short for 'está todo bien'. Dominicans love to compress phrases — this two-syllable response covers what takes other dialects a full sentence.",
    audioHint: "The extreme shortening is a Dominican trademark",
    category: "expression",
  },
  {
    id: "do3",
    phrase: "Vaina",
    meaning: "Thing / stuff / situation (universal word)",
    correctDialect: "Dominican",
    correctFlag: "🇩🇴",
    pronunciation: "vai-nah",
    teachingMoment: "The most Dominican word ever! It can mean literally anything — a thing, a problem, a situation, even nothing. Context is everything. BilingueBlogs calls it 'the Swiss Army knife of Dominican Spanish'.",
    audioHint: "If someone uses this word for everything, they're likely Dominican",
    category: "slang",
  },
  // Mexican
  {
    id: "mx1",
    phrase: "¡No manches!",
    meaning: "No way! / You're kidding!",
    correctDialect: "Mexican",
    correctFlag: "🇲🇽",
    pronunciation: "noh-mahn-ches",
    teachingMoment: "A family-friendly exclamation of surprise. It's the clean version of a stronger expression. You'll hear this in Mexican telenovelas, schools, and everyday conversation.",
    audioHint: "The melodic, sing-song intonation is distinctly Mexican",
    category: "expression",
  },
  {
    id: "mx2",
    phrase: "Órale",
    meaning: "Alright! / Let's go! / Wow!",
    correctDialect: "Mexican",
    correctFlag: "🇲🇽",
    pronunciation: "oh-rah-leh",
    teachingMoment: "One of the most versatile Mexican expressions. It can mean agreement, surprise, encouragement, or even a greeting depending on tone. Think of it as the Mexican 'cool'.",
    audioHint: "The emphasis on the first syllable with a rising tone",
    category: "slang",
  },
  {
    id: "mx3",
    phrase: "¿Mande?",
    meaning: "Pardon? / What did you say?",
    correctDialect: "Mexican",
    correctFlag: "🇲🇽",
    pronunciation: "mahn-deh",
    teachingMoment: "While other Spanish speakers say '¿Qué?' or '¿Cómo?', Mexicans use '¿Mande?' which literally means 'command me'. It shows the formal politeness embedded in Mexican culture.",
    audioHint: "This polite form is almost exclusively Mexican",
    category: "grammar",
  },
  // Colombian
  {
    id: "co1",
    phrase: "¡Qué chimba!",
    meaning: "How awesome! / That's great!",
    correctDialect: "Colombian",
    correctFlag: "🇨🇴",
    pronunciation: "keh-cheem-bah",
    teachingMoment: "A very Colombian expression of excitement. Be careful though — in some contexts it can be vulgar, but among friends it's pure enthusiasm. Colombians from Medellín use this constantly.",
    audioHint: "The clear, crisp pronunciation with no dropped consonants",
    category: "slang",
  },
  {
    id: "co2",
    phrase: "Parcero / Parce",
    meaning: "Buddy / Bro / Friend",
    correctDialect: "Colombian",
    correctFlag: "🇨🇴",
    pronunciation: "par-seh-roh / par-seh",
    teachingMoment: "The Colombian equivalent of 'bro'. Originally from Medellín street culture, it's now used across Colombia. You'll hear 'parce' (shortened) more than the full 'parcero'.",
    audioHint: "If someone calls you 'parce', you're in Colombia",
    category: "slang",
  },
  {
    id: "co3",
    phrase: "¡De una!",
    meaning: "For sure! / Absolutely! / Let's do it!",
    correctDialect: "Colombian",
    correctFlag: "🇨🇴",
    pronunciation: "deh-oo-nah",
    teachingMoment: "Literally 'of one' but means immediate agreement. When a Colombian says 'de una', they're 100% in. It's their way of saying 'count me in, no hesitation'.",
    audioHint: "Quick, enthusiastic delivery with clear vowels",
    category: "expression",
  },
  // Puerto Rican
  {
    id: "pr1",
    phrase: "Wepa!",
    meaning: "Awesome! / Let's go! / Yeah!",
    correctDialect: "Puerto Rican",
    correctFlag: "🇵🇷",
    pronunciation: "weh-pah",
    teachingMoment: "The quintessential Puerto Rican exclamation! You'll hear it at parties, concerts, and celebrations. It's pure boricua energy — no other dialect uses this word.",
    audioHint: "The enthusiastic, musical delivery with Caribbean rhythm",
    category: "expression",
  },
  {
    id: "pr2",
    phrase: "Chacho",
    meaning: "Dude / Man (from 'muchacho')",
    correctDialect: "Puerto Rican",
    correctFlag: "🇵🇷",
    pronunciation: "chah-choh",
    teachingMoment: "Shortened from 'muchacho' (boy/dude). Puerto Ricans love abbreviations, and this one is used constantly — 'Chacho, ¿qué pasó?' is how many conversations start on the island.",
    audioHint: "The 'ch' sound and Caribbean cadence",
    category: "slang",
  },
  // Venezuelan
  {
    id: "ve1",
    phrase: "¡Chévere!",
    meaning: "Cool! / Awesome! / Great!",
    correctDialect: "Venezuelan",
    correctFlag: "🇻🇪",
    pronunciation: "cheh-veh-reh",
    teachingMoment: "While Colombians also use it, 'chévere' is THE Venezuelan word. It's used 50 times a day by the average Venezuelan. Everything good is 'chévere' — food, people, situations, weather.",
    audioHint: "The emphasis on the first syllable and Caribbean softness",
    category: "slang",
  },
  {
    id: "ve2",
    phrase: "Chamo / Chama",
    meaning: "Dude / Girl (young person)",
    correctDialect: "Venezuelan",
    correctFlag: "🇻🇪",
    pronunciation: "chah-moh / chah-mah",
    teachingMoment: "The Venezuelan way to address friends. 'Chamo' for guys, 'chama' for girls. It's so Venezuelan that hearing it immediately identifies the speaker's nationality.",
    audioHint: "This word is exclusively Venezuelan — instant identifier",
    category: "slang",
  },
  // Cuban
  {
    id: "cu1",
    phrase: "¿Qué bolá?",
    meaning: "What's up? / How's it going?",
    correctDialect: "Cuban",
    correctFlag: "🇨🇺",
    pronunciation: "keh-boh-lah",
    teachingMoment: "The Cuban greeting! While Dominicans say '¿Qué lo que?' and Puerto Ricans say '¿Qué es la que?', Cubans have their own: '¿Qué bolá?' — literally 'what ball?' but meaning 'what's happening?'",
    audioHint: "The rhythmic, musical delivery with aspirated consonants",
    category: "greeting",
  },
  {
    id: "cu2",
    phrase: "Asere",
    meaning: "Buddy / Friend / Bro",
    correctDialect: "Cuban",
    correctFlag: "🇨🇺",
    pronunciation: "ah-seh-reh",
    teachingMoment: "From Afro-Cuban Lucumí language. It's the Cuban 'bro' — deeply tied to Cuban culture and African heritage. You'll hear 'Asere, ¿qué bolá?' as a complete greeting.",
    audioHint: "The Afro-Caribbean rhythm and soft 'r'",
    category: "slang",
  },
  // Argentine
  {
    id: "ar1",
    phrase: "¡Che, boludo!",
    meaning: "Hey, dude! (friendly)",
    correctDialect: "Argentine",
    correctFlag: "🇦🇷",
    pronunciation: "cheh-boh-loo-doh",
    teachingMoment: "'Che' is so Argentine that Che Guevara got his nickname from it! Combined with 'boludo' (which can be friendly or insulting depending on tone), this is peak Buenos Aires street talk.",
    audioHint: "The Italian-influenced intonation and 'sh' sound for 'll'",
    category: "slang",
  },
  {
    id: "ar2",
    phrase: "Re copado",
    meaning: "Really cool / Super awesome",
    correctDialect: "Argentine",
    correctFlag: "🇦🇷",
    pronunciation: "reh-coh-pah-doh",
    teachingMoment: "Argentines use 're' as an intensifier (like 'super' or 'really'). 'Copado' means cool. Together it's 'really cool' — you'll hear this in Buenos Aires cafés constantly.",
    audioHint: "The 're' prefix as intensifier is distinctly Argentine",
    category: "slang",
  },
];

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "@dialect_challenge_stats";
const ROUNDS_PER_GAME = 7;
const TIME_LIMITS = { easy: 20, medium: 12, hard: 7 };

// ─── Component ──────────────────────────────────────────────────────────────

export default function DialectChallengeScreen() {
  const { showStreakToast } = useUsage();
  const colors = useColors();
  const router = useRouter();

  // Game state
  const [gameMode, setGameMode] = useState<"menu" | "playing" | "results">("menu");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [rounds, setRounds] = useState<ChallengeRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerTime, setAnswerTime] = useState(0); // ms to answer
  const [stats, setStats] = useState<ChallengeStats>({
    totalPlayed: 0,
    totalCorrect: 0,
    bestStreak: 0,
    bestTime: Infinity,
    dialectsMastered: [],
    lastPlayed: "",
  });

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundStartRef = useRef<number>(0);

  // Animations
  const shakeX = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const timerProgress = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    loadStats();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadStats = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setStats(JSON.parse(raw));
    } catch {}
  };

  const saveStats = async (newStats: ChallengeStats) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      setStats(newStats);
    } catch {}
  };

  // ─── Game Logic ─────────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    // Shuffle and pick phrases
    const shuffled = [...CHALLENGE_PHRASES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, ROUNDS_PER_GAME);

    const gameRounds: ChallengeRound[] = selected.map((phrase) => {
      // Pick 3 wrong choices + correct one
      const wrongChoices = DIALECT_CHOICES
        .filter((c) => c.name !== phrase.correctDialect)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const choices = [
        ...wrongChoices,
        { name: phrase.correctDialect, flag: phrase.correctFlag },
      ].sort(() => Math.random() - 0.5);

      return {
        phrase,
        choices,
        timeLimit: TIME_LIMITS[difficulty],
      };
    });

    setRounds(gameRounds);
    setCurrentRound(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswered(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setGameMode("playing");
    startTimer(TIME_LIMITS[difficulty]);
  }, [difficulty]);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    roundStartRef.current = Date.now();
    timerProgress.setValue(1);

    RNAnimated.timing(timerProgress, {
      toValue: 0,
      duration: seconds * 1000,
      useNativeDriver: false,
    }).start();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (answered) return;
    setAnswered(true);
    setIsCorrect(false);
    setStreak(0);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleAnswer = useCallback((dialectName: string) => {
    if (answered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = Date.now() - roundStartRef.current;
    setAnswerTime(elapsed);

    const round = rounds[currentRound];
    const correct = dialectName === round.phrase.correctDialect;

    setAnswered(true);
    setSelectedAnswer(dialectName);
    setIsCorrect(correct);

    if (correct) {
      const newStreak = streak + 1;
      setScore((prev) => prev + 1);
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      pulseScale.value = withSequence(
        withTiming(1.05, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    } else {
      setStreak(0);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [answered, rounds, currentRound, streak, bestStreak]);

  const nextRound = useCallback(() => {
    if (currentRound >= rounds.length - 1) {
      // Game over
      const newStats: ChallengeStats = {
        totalPlayed: stats.totalPlayed + rounds.length,
        totalCorrect: stats.totalCorrect + score + (isCorrect ? 0 : 0), // score already includes current
        bestStreak: Math.max(stats.bestStreak, bestStreak),
        bestTime: Math.min(stats.bestTime, answerTime > 0 ? answerTime : Infinity),
        dialectsMastered: stats.dialectsMastered,
        lastPlayed: new Date().toISOString(),
      };
      saveStats(newStats);
      markPracticeAndToast(showStreakToast);
      setGameMode("results");
      return;
    }

    setCurrentRound((prev) => prev + 1);
    setAnswered(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    startTimer(TIME_LIMITS[difficulty]);
  }, [currentRound, rounds, score, bestStreak, stats, difficulty, answerTime, isCorrect]);

  const speakPhrase = (phrase: string) => {
    Speech.speak(phrase, {
      language: "es",
      rate: 0.85,
      pitch: 1.0,
    });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // ─── Animated Styles ────────────────────────────────────────────────────────

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const timerWidth = timerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ─── Results Screen ─────────────────────────────────────────────────────────

  if (gameMode === "results") {
    const percentage = Math.round((score / rounds.length) * 100);
    const grade = percentage >= 90 ? "S" : percentage >= 80 ? "A" : percentage >= 60 ? "B" : percentage >= 40 ? "C" : "D";
    const gradeColor = percentage >= 80 ? colors.success : percentage >= 60 ? colors.warning : colors.error;

    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setGameMode("menu")} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
              <Ionicons name="chevron-back" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Challenge Complete!</Text>
            <View style={{ width: 36 }} />
          </View>

          <Animated.View entering={FadeIn.duration(400)} style={styles.resultsContainer}>
            {/* Grade Badge */}
            <View style={[styles.gradeBadge, { borderColor: gradeColor }]}>
              <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
              <Text style={[styles.gradeSubtext, { color: colors.muted }]}>{percentage}%</Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statValue, { color: colors.success }]}>{score}/{rounds.length}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Correct</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{bestStreak}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Best Streak</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {stats.bestStreak > 0 ? stats.bestStreak : bestStreak}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>All-Time</Text>
              </View>
            </View>

            {/* BilingueBlogs Tip */}
            <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.tipEmoji}>🗣️</Text>
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: colors.foreground }]}>BilingueBlogs Tip</Text>
                <Text style={[styles.tipText, { color: colors.muted }]}>
                  {percentage >= 80
                    ? "You've got an ear for dialects! Try listening to music from different countries to sharpen your skills even more."
                    : percentage >= 50
                    ? "Good progress! Focus on the unique greetings each country uses — they're the easiest identifiers."
                    : "Keep practicing! Start by learning one signature word from each country — like 'vaina' for Dominican or 'che' for Argentine."}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={startGame}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => router.push("/dialect-quiz" as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="trophy" size={16} color={colors.primary} />
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Try AI-Generated Quiz</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => setGameMode("menu")}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.muted }]}>Back to Menu</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Menu Screen ──────────────────────────────────────────────────────────

  if (gameMode === "menu") {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
              <Ionicons name="chevron-back" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dialect Challenge</Text>
            <TouchableOpacity
              onPress={() => router.push("/dialect-quiz-leaderboard" as any)}
              style={[styles.backBtn, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="trophy" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.duration(400)} style={styles.menuContainer}>
            {/* Hero */}
            <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.heroEmoji}>🌍🗣️</Text>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                Can You Spot the Dialect?
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
                Inspired by @bilingueblogs — identify which Spanish-speaking country a phrase comes from. Learn the unique slang, greetings, and expressions that make each dialect special.
              </Text>
            </View>

            {/* Stats */}
            {stats.totalPlayed > 0 && (
              <View style={[styles.menuStats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.menuStatsTitle, { color: colors.foreground }]}>Your Record</Text>
                <View style={styles.menuStatsRow}>
                  <View style={styles.menuStatItem}>
                    <Text style={[styles.menuStatValue, { color: colors.success }]}>
                      {Math.round((stats.totalCorrect / Math.max(stats.totalPlayed, 1)) * 100)}%
                    </Text>
                    <Text style={[styles.menuStatLabel, { color: colors.muted }]}>Accuracy</Text>
                  </View>
                  <View style={styles.menuStatItem}>
                    <Text style={[styles.menuStatValue, { color: colors.primary }]}>{stats.bestStreak}</Text>
                    <Text style={[styles.menuStatLabel, { color: colors.muted }]}>Best Streak</Text>
                  </View>
                  <View style={styles.menuStatItem}>
                    <Text style={[styles.menuStatValue, { color: colors.warning }]}>{stats.totalPlayed}</Text>
                    <Text style={[styles.menuStatLabel, { color: colors.muted }]}>Phrases</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Difficulty */}
            <Text style={[styles.difficultyTitle, { color: colors.foreground }]}>Speed Challenge</Text>
            <View style={styles.difficultyRow}>
              {(["easy", "medium", "hard"] as const).map((d) => {
                const labels = { easy: "Relaxed (20s)", medium: "Normal (12s)", hard: "Speed (7s)" };
                const icons = { easy: "leaf", medium: "flame", hard: "flash" } as const;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.difficultyBtn,
                      {
                        backgroundColor: difficulty === d ? colors.primary : colors.surface,
                        borderColor: difficulty === d ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setDifficulty(d)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={icons[d]}
                      size={16}
                      color={difficulty === d ? "#fff" : colors.muted}
                    />
                    <Text style={[styles.difficultyText, { color: difficulty === d ? "#fff" : colors.muted }]}>
                      {labels[d]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Featured Dialects */}
            <Text style={[styles.dialectsTitle, { color: colors.foreground }]}>Featured Dialects</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dialectsScroll}>
              {DIALECT_CHOICES.map((d) => (
                <View key={d.name} style={[styles.dialectTag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={styles.dialectTagFlag}>{d.flag}</Text>
                  <Text style={[styles.dialectTagName, { color: colors.foreground }]}>{d.name}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Start Button */}
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
              onPress={startGame}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.startBtnText}>Start Challenge</Text>
            </TouchableOpacity>

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.muted }]}>
                {ROUNDS_PER_GAME} rounds per game • Hear phrases spoken aloud • Learn cultural context after each answer
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Playing Screen ───────────────────────────────────────────────────────

  const round = rounds[currentRound];
  if (!round) return null;

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header with progress */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setGameMode("menu")} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.progressArea}>
            <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((currentRound + 1) / rounds.length) * 100}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.muted }]}>
              {currentRound + 1}/{rounds.length}
            </Text>
          </View>
          <View style={styles.scoreArea}>
            {streak > 0 && <Text style={[styles.streakBadge, { color: colors.warning }]}>🔥{streak}</Text>}
            <Text style={[styles.scoreLabel, { color: colors.success }]}>{score}</Text>
          </View>
        </View>

        {/* Timer Bar */}
        <View style={[styles.timerContainer, { backgroundColor: colors.surface }]}>
          <RNAnimated.View
            style={[
              styles.timerFill,
              {
                width: timerWidth,
                backgroundColor: timeLeft <= 3 ? colors.error : timeLeft <= 5 ? colors.warning : colors.primary,
              },
            ]}
          />
          <Text style={[styles.timerText, { color: timeLeft <= 3 ? colors.error : colors.foreground }]}>
            {timeLeft}s
          </Text>
        </View>

        {/* Phrase Card */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.phraseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.phraseLabel, { color: colors.muted }]}>
            Which dialect is this from?
          </Text>
          <Text style={[styles.phraseText, { color: colors.foreground }]}>
            "{round.phrase.phrase}"
          </Text>
          {round.phrase.pronunciation && (
            <Text style={[styles.phrasePronunciation, { color: colors.muted }]}>
              /{round.phrase.pronunciation}/
            </Text>
          )}
          <Text style={[styles.phraseMeaning, { color: colors.muted }]}>
            Meaning: {round.phrase.meaning}
          </Text>

          {/* Audio Button */}
          <TouchableOpacity
            style={[styles.audioBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}
            onPress={() => speakPhrase(round.phrase.phrase)}
            activeOpacity={0.7}
          >
            <Ionicons name="volume-high" size={18} color={colors.primary} />
            <Text style={[styles.audioBtnText, { color: colors.primary }]}>Hear It</Text>
          </TouchableOpacity>

          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {round.phrase.category.charAt(0).toUpperCase() + round.phrase.category.slice(1)}
            </Text>
          </View>
        </Animated.View>

        {/* Answer Choices */}
        <Animated.View style={[styles.choicesGrid, shakeStyle]}>
          {round.choices.map((choice, idx) => {
            const isSelected = selectedAnswer === choice.name;
            const isCorrectChoice = choice.name === round.phrase.correctDialect;
            const showResult = answered;

            let bgColor = colors.surface;
            let borderColor = colors.border;
            if (showResult && isCorrectChoice) {
              bgColor = colors.success + "20";
              borderColor = colors.success;
            } else if (showResult && isSelected && !isCorrect) {
              bgColor = colors.error + "20";
              borderColor = colors.error;
            }

            return (
              <TouchableOpacity
                key={`${choice.name}-${idx}`}
                style={[styles.choiceBtn, { backgroundColor: bgColor, borderColor }]}
                onPress={() => handleAnswer(choice.name)}
                disabled={answered}
                activeOpacity={0.7}
              >
                <Text style={styles.choiceFlag}>{choice.flag}</Text>
                <Text style={[styles.choiceName, { color: colors.foreground }]}>{choice.name}</Text>
                {showResult && isCorrectChoice && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                )}
                {showResult && isSelected && !isCorrect && (
                  <Ionicons name="close-circle" size={18} color={colors.error} />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Teaching Moment (after answer) */}
        {answered && (
          <Animated.View entering={FadeInUp.duration(300)}>
            <View style={[styles.teachingCard, { backgroundColor: colors.surface, borderColor: isCorrect ? colors.success + "40" : colors.error + "40" }]}>
              <View style={styles.teachingHeader}>
                <Text style={[styles.teachingResult, { color: isCorrect ? colors.success : colors.error }]}>
                  {isCorrect ? "Correct! 🎉" : `It's ${round.phrase.correctDialect}! ${round.phrase.correctFlag}`}
                </Text>
              </View>
              <Text style={[styles.teachingText, { color: colors.foreground }]}>
                {round.phrase.teachingMoment}
              </Text>
              <View style={[styles.audioHintRow, { backgroundColor: colors.primary + "08" }]}>
                <Ionicons name="ear" size={14} color={colors.primary} />
                <Text style={[styles.audioHintText, { color: colors.muted }]}>
                  {round.phrase.audioHint}
                </Text>
              </View>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={nextRound}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>
                {currentRound >= rounds.length - 1 ? "See Results" : "Next Phrase"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  // Timer
  timerContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
  },
  timerFill: {
    height: "100%",
    borderRadius: 4,
  },
  timerText: {
    position: "absolute",
    right: 8,
    top: -18,
    fontSize: 12,
    fontWeight: "700",
  },
  // Progress
  progressArea: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  scoreArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 60,
    justifyContent: "flex-end",
  },
  streakBadge: {
    fontSize: 14,
    fontWeight: "700",
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  // Phrase Card
  phraseCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: "center",
  },
  phraseLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  phraseText: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  phrasePronunciation: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 6,
  },
  phraseMeaning: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  audioBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  audioBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Choices
  choicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  choiceBtn: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  choiceFlag: {
    fontSize: 20,
  },
  choiceName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  // Teaching Moment
  teachingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  teachingHeader: {
    marginBottom: 8,
  },
  teachingResult: {
    fontSize: 15,
    fontWeight: "700",
  },
  teachingText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  audioHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  audioHintText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  // Buttons
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 16,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  // Menu
  menuContainer: {
    gap: 16,
  },
  heroCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  heroEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  menuStats: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  menuStatsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  menuStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  menuStatItem: {
    alignItems: "center",
  },
  menuStatValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  menuStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  difficultyTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dialectsTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  dialectsScroll: {
    flexGrow: 0,
  },
  dialectTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  dialectTagFlag: {
    fontSize: 16,
  },
  dialectTagName: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  // Results
  resultsContainer: {
    alignItems: "center",
    gap: 16,
    paddingTop: 20,
  },
  gradeBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeText: {
    fontSize: 32,
    fontWeight: "800",
  },
  gradeSubtext: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  tipCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
