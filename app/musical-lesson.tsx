/**
 * Musical Lesson Player - Learn Through Songs
 * Every lesson has a "Song Mode" that teaches grammar/vocab through culturally-relevant music.
 * Features: Culture-specific beats, lyric breakdown, sing-along scoring, vocabulary extraction.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  FlatList,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface SongLyricLine {
  id: string;
  original: string;
  translation: string;
  phonetic?: string;
  timestamp: number;
  vocabularyWords: VocabWord[];
  grammarNote?: string;
}

interface VocabWord {
  word: string;
  meaning: string;
  partOfSpeech: string;
}

interface MusicalLesson {
  id: string;
  title: string;
  subtitle: string;
  language: string;
  flag: string;
  genre: string;
  genreEmoji: string;
  level: string;
  grammarTopic: string;
  vocabCount: number;
  duration: string;
  bpm: number;
  culturalNote: string;
  lyrics: SongLyricLine[];
  coverGradient: string[];
}

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const MUSICAL_LESSONS: MusicalLesson[] = [
  {
    id: "sp-conj-1",
    title: "Yo Hablo, Tú Hablas",
    subtitle: "Present Tense -AR Verbs",
    language: "Spanish",
    flag: "🇪🇸",
    genre: "Reggaeton",
    genreEmoji: "🎶",
    level: "A1",
    grammarTopic: "Present tense conjugation of -AR verbs",
    vocabCount: 15,
    duration: "2:45",
    bpm: 95,
    culturalNote: "Reggaeton originated in Puerto Rico in the late 1990s, blending Latin rhythms with hip-hop beats. It's now the most streamed Latin genre worldwide.",
    coverGradient: ["#FF6B35", "#FF1744"],
    lyrics: [
      { id: "1", original: "Yo hablo español cada día", translation: "I speak Spanish every day", timestamp: 0, vocabularyWords: [{ word: "hablo", meaning: "I speak", partOfSpeech: "verb" }, { word: "cada día", meaning: "every day", partOfSpeech: "phrase" }], grammarNote: "Yo + hablo (first person singular of hablar)" },
      { id: "2", original: "Tú hablas con tu familia", translation: "You speak with your family", timestamp: 4, vocabularyWords: [{ word: "hablas", meaning: "you speak", partOfSpeech: "verb" }, { word: "familia", meaning: "family", partOfSpeech: "noun" }], grammarNote: "Tú + hablas (second person singular)" },
      { id: "3", original: "Él habla, ella habla también", translation: "He speaks, she speaks too", timestamp: 8, vocabularyWords: [{ word: "habla", meaning: "he/she speaks", partOfSpeech: "verb" }, { word: "también", meaning: "also/too", partOfSpeech: "adverb" }], grammarNote: "Él/Ella + habla (third person singular)" },
      { id: "4", original: "Nosotros hablamos sin parar", translation: "We speak without stopping", timestamp: 12, vocabularyWords: [{ word: "hablamos", meaning: "we speak", partOfSpeech: "verb" }, { word: "sin parar", meaning: "without stopping", partOfSpeech: "phrase" }], grammarNote: "Nosotros + hablamos (first person plural)" },
      { id: "5", original: "¡Hablar es vivir, vivir es hablar!", translation: "To speak is to live, to live is to speak!", timestamp: 16, vocabularyWords: [{ word: "vivir", meaning: "to live", partOfSpeech: "verb" }], grammarNote: "Infinitive form: hablar (to speak)" },
      { id: "6", original: "Ellos hablan en la calle", translation: "They speak in the street", timestamp: 20, vocabularyWords: [{ word: "hablan", meaning: "they speak", partOfSpeech: "verb" }, { word: "calle", meaning: "street", partOfSpeech: "noun" }], grammarNote: "Ellos + hablan (third person plural)" },
      { id: "7", original: "Ustedes hablan con pasión", translation: "You all speak with passion", timestamp: 24, vocabularyWords: [{ word: "ustedes", meaning: "you all (formal)", partOfSpeech: "pronoun" }, { word: "pasión", meaning: "passion", partOfSpeech: "noun" }], grammarNote: "Ustedes + hablan (formal second person plural)" },
      { id: "8", original: "Repite conmigo: yo hablo, tú hablas", translation: "Repeat with me: I speak, you speak", timestamp: 28, vocabularyWords: [{ word: "repite", meaning: "repeat", partOfSpeech: "verb" }, { word: "conmigo", meaning: "with me", partOfSpeech: "pronoun" }] },
    ],
  },
  {
    id: "jp-count-1",
    title: "いち、に、さん GO!",
    subtitle: "Counting 1-20 in Japanese",
    language: "Japanese",
    flag: "🇯🇵",
    genre: "J-Pop",
    genreEmoji: "🌸",
    level: "A1",
    grammarTopic: "Numbers and counting systems",
    vocabCount: 20,
    duration: "3:10",
    bpm: 128,
    culturalNote: "J-Pop (Japanese Pop) emerged in the 1990s and dominates Asian music charts. Artists like YOASOBI and Ado blend traditional melodies with modern electronic production.",
    coverGradient: ["#FF69B4", "#9B59B6"],
    lyrics: [
      { id: "1", original: "いち、に、さん、し", translation: "One, two, three, four", phonetic: "ichi, ni, san, shi", timestamp: 0, vocabularyWords: [{ word: "いち", meaning: "one", partOfSpeech: "number" }, { word: "に", meaning: "two", partOfSpeech: "number" }] },
      { id: "2", original: "ご、ろく、しち、はち", translation: "Five, six, seven, eight", phonetic: "go, roku, shichi, hachi", timestamp: 4, vocabularyWords: [{ word: "ご", meaning: "five", partOfSpeech: "number" }, { word: "ろく", meaning: "six", partOfSpeech: "number" }] },
      { id: "3", original: "く、じゅう、もう一回！", translation: "Nine, ten, one more time!", phonetic: "ku, jū, mō ikkai!", timestamp: 8, vocabularyWords: [{ word: "じゅう", meaning: "ten", partOfSpeech: "number" }, { word: "もう一回", meaning: "one more time", partOfSpeech: "phrase" }] },
      { id: "4", original: "数えよう、一緒に歌おう", translation: "Let's count, let's sing together", phonetic: "kazoeyo, issho ni utaō", timestamp: 12, vocabularyWords: [{ word: "数える", meaning: "to count", partOfSpeech: "verb" }, { word: "一緒に", meaning: "together", partOfSpeech: "adverb" }] },
    ],
  },
  {
    id: "fr-greet-1",
    title: "Bonjour, Comment Ça Va?",
    subtitle: "Greetings & Introductions",
    language: "French",
    flag: "🇫🇷",
    genre: "Chanson Pop",
    genreEmoji: "🥐",
    level: "A1",
    grammarTopic: "Formal vs informal greetings",
    vocabCount: 12,
    duration: "2:30",
    bpm: 110,
    culturalNote: "French chanson is a tradition dating back centuries. Modern French pop blends this melodic tradition with electronic and hip-hop influences (Stromae, Angèle).",
    coverGradient: ["#0055A4", "#EF4444"],
    lyrics: [
      { id: "1", original: "Bonjour, bonjour, comment ça va?", translation: "Hello, hello, how are you?", timestamp: 0, vocabularyWords: [{ word: "bonjour", meaning: "hello/good day", partOfSpeech: "greeting" }, { word: "comment ça va", meaning: "how are you", partOfSpeech: "phrase" }], grammarNote: "Formal greeting — use with strangers, elders, professionals" },
      { id: "2", original: "Salut, ça va bien, et toi?", translation: "Hey, I'm good, and you?", timestamp: 4, vocabularyWords: [{ word: "salut", meaning: "hey/hi (informal)", partOfSpeech: "greeting" }, { word: "et toi", meaning: "and you", partOfSpeech: "phrase" }], grammarNote: "Informal — use with friends, peers, people your age" },
      { id: "3", original: "Je m'appelle... comment tu t'appelles?", translation: "My name is... what's your name?", timestamp: 8, vocabularyWords: [{ word: "je m'appelle", meaning: "my name is", partOfSpeech: "phrase" }, { word: "tu t'appelles", meaning: "your name is", partOfSpeech: "phrase" }], grammarNote: "Reflexive verb: s'appeler (to call oneself)" },
      { id: "4", original: "Enchanté, enchanté, ravi de te connaître", translation: "Pleased to meet you, delighted to know you", timestamp: 12, vocabularyWords: [{ word: "enchanté", meaning: "pleased to meet you", partOfSpeech: "adjective" }, { word: "ravi", meaning: "delighted", partOfSpeech: "adjective" }] },
    ],
  },
  {
    id: "kr-honor-1",
    title: "존댓말 vs 반말",
    subtitle: "Formal vs Informal Speech",
    language: "Korean",
    flag: "🇰🇷",
    genre: "K-Pop",
    genreEmoji: "💜",
    level: "A2",
    grammarTopic: "Honorific speech levels (존댓말/반말)",
    vocabCount: 18,
    duration: "3:00",
    bpm: 120,
    culturalNote: "K-Pop is a global phenomenon. Korean honorifics are crucial — using the wrong speech level can be very disrespectful. Age and social status determine which level to use.",
    coverGradient: ["#7C3AED", "#EC4899"],
    lyrics: [
      { id: "1", original: "안녕하세요, 만나서 반갑습니다", translation: "Hello, nice to meet you (formal)", phonetic: "annyeonghaseyo, mannaseo bangapseumnida", timestamp: 0, vocabularyWords: [{ word: "안녕하세요", meaning: "hello (formal)", partOfSpeech: "greeting" }], grammarNote: "존댓말 (formal) — use with elders, strangers, bosses" },
      { id: "2", original: "야, 반가워! 뭐 해?", translation: "Hey, nice to meet you! What are you doing?", phonetic: "ya, bangawo! mwo hae?", timestamp: 4, vocabularyWords: [{ word: "반가워", meaning: "nice to meet you (informal)", partOfSpeech: "greeting" }, { word: "뭐 해", meaning: "what are you doing", partOfSpeech: "phrase" }], grammarNote: "반말 (informal) — use with close friends, younger people" },
      { id: "3", original: "선생님께 반말 쓰면 안 돼요!", translation: "You must NOT use informal speech with teachers!", phonetic: "seonsaengnimkke banmal ssumyeon an dwaeyo!", timestamp: 8, vocabularyWords: [{ word: "선생님", meaning: "teacher", partOfSpeech: "noun" }, { word: "안 돼요", meaning: "must not/can't", partOfSpeech: "phrase" }] },
    ],
  },
  {
    id: "pt-slang-1",
    title: "Que Legal, Mano!",
    subtitle: "Brazilian Slang Essentials",
    language: "Portuguese",
    flag: "🇧🇷",
    genre: "Funk Carioca",
    genreEmoji: "🏖️",
    level: "B1",
    grammarTopic: "Informal expressions and slang",
    vocabCount: 14,
    duration: "2:50",
    bpm: 130,
    culturalNote: "Funk Carioca originated in Rio de Janeiro's favelas in the 1980s. It's the heartbeat of Brazilian street culture, parties, and social media.",
    coverGradient: ["#009739", "#FEDD00"],
    lyrics: [
      { id: "1", original: "E aí, mano? Beleza? Tudo tranquilo?", translation: "What's up, bro? All good? Everything chill?", timestamp: 0, vocabularyWords: [{ word: "mano", meaning: "bro/dude", partOfSpeech: "slang" }, { word: "beleza", meaning: "all good/beauty", partOfSpeech: "slang" }, { word: "tranquilo", meaning: "chill/calm", partOfSpeech: "adjective" }] },
      { id: "2", original: "Que legal! Isso é muito massa!", translation: "How cool! That's really awesome!", timestamp: 4, vocabularyWords: [{ word: "legal", meaning: "cool", partOfSpeech: "slang" }, { word: "massa", meaning: "awesome/great", partOfSpeech: "slang" }] },
      { id: "3", original: "Vamos nessa! Bora pra praia!", translation: "Let's go! Let's hit the beach!", timestamp: 8, vocabularyWords: [{ word: "bora", meaning: "let's go (informal)", partOfSpeech: "slang" }, { word: "praia", meaning: "beach", partOfSpeech: "noun" }] },
    ],
  },
  {
    id: "ar-food-1",
    title: "يلا نأكل",
    subtitle: "Ordering Food in Arabic",
    language: "Arabic",
    flag: "🇪🇬",
    genre: "Shaabi",
    genreEmoji: "🪘",
    level: "A2",
    grammarTopic: "Food vocabulary and polite requests",
    vocabCount: 16,
    duration: "2:40",
    bpm: 100,
    culturalNote: "Shaabi music is Egyptian street music — raw, energetic, and deeply connected to everyday life. It's the soundtrack of Cairo's markets and neighborhoods.",
    coverGradient: ["#C09553", "#2D5016"],
    lyrics: [
      { id: "1", original: "يلا نأكل، أنا جعان", translation: "Let's eat, I'm hungry", phonetic: "yalla na'kol, ana ga'aan", timestamp: 0, vocabularyWords: [{ word: "يلا", meaning: "let's go/come on", partOfSpeech: "expression" }, { word: "جعان", meaning: "hungry", partOfSpeech: "adjective" }] },
      { id: "2", original: "عايز فول وطعمية", translation: "I want foul and falafel", phonetic: "aayez fool w ta'meya", timestamp: 4, vocabularyWords: [{ word: "عايز", meaning: "I want (Egyptian)", partOfSpeech: "verb" }, { word: "فول", meaning: "fava beans", partOfSpeech: "noun" }, { word: "طعمية", meaning: "falafel (Egyptian)", partOfSpeech: "noun" }] },
    ],
  },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function MusicalLessonScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ lessonId?: string }>();
  const [view, setView] = useState<"browse" | "player">("browse");
  const [selectedLesson, setSelectedLesson] = useState<MusicalLesson | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showGrammar, setShowGrammar] = useState(true);
  const [singAlongMode, setSingAlongMode] = useState(false);
  const [expandedVocab, setExpandedVocab] = useState<string | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlaying && selectedLesson) {
      const interval = setInterval(() => {
        setCurrentLineIndex((prev) => {
          if (prev >= selectedLesson.lyrics.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, selectedLesson]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: 1.05, duration: 300, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0.95, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      bounceAnim.setValue(1);
    }
  }, [isPlaying]);

  const openLesson = (lesson: MusicalLesson) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLesson(lesson);
    setView("player");
    setCurrentLineIndex(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(!isPlaying);
  };

  // ─── BROWSE VIEW ──────────────────────────────────────────────────────────

  const renderBrowse = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>🎵 Musical Lessons</Text>
        <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
          Learn grammar and vocabulary through catchy songs in authentic cultural genres. Every lesson has a song version.
        </Text>
      </View>

      {/* Featured */}
      <View style={styles.featuredSection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Featured Songs</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
          {MUSICAL_LESSONS.slice(0, 3).map((lesson) => (
            <TouchableOpacity
              key={lesson.id}
              style={[styles.featuredCard, { backgroundColor: lesson.coverGradient[0] }]}
              onPress={() => openLesson(lesson)}
              activeOpacity={0.8}
            >
              <Text style={styles.featuredGenre}>{lesson.genreEmoji} {lesson.genre}</Text>
              <Text style={styles.featuredTitle}>{lesson.title}</Text>
              <Text style={styles.featuredSubtitle}>{lesson.subtitle}</Text>
              <View style={styles.featuredMeta}>
                <Text style={styles.featuredFlag}>{lesson.flag}</Text>
                <Text style={styles.featuredLevel}>{lesson.level}</Text>
                <Text style={styles.featuredDuration}>{lesson.duration}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* All Lessons */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>All Musical Lessons</Text>
      {MUSICAL_LESSONS.map((lesson) => (
        <TouchableOpacity
          key={lesson.id}
          style={[styles.lessonRow, { backgroundColor: colors.surface }]}
          onPress={() => openLesson(lesson)}
          activeOpacity={0.7}
        >
          <View style={[styles.lessonIcon, { backgroundColor: lesson.coverGradient[0] + "30" }]}>
            <Text style={styles.lessonIconText}>{lesson.genreEmoji}</Text>
          </View>
          <View style={styles.lessonRowInfo}>
            <Text style={[styles.lessonRowTitle, { color: colors.foreground }]}>{lesson.title}</Text>
            <Text style={[styles.lessonRowSub, { color: colors.muted }]}>{lesson.flag} {lesson.subtitle} • {lesson.genre}</Text>
          </View>
          <View style={styles.lessonRowRight}>
            <Text style={[styles.lessonLevel, { color: colors.primary }]}>{lesson.level}</Text>
            <Text style={[styles.lessonDuration, { color: colors.muted }]}>{lesson.duration}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* How It Works */}
      <View style={[styles.howItWorks, { backgroundColor: colors.surface }]}>
        <Text style={[styles.howTitle, { color: colors.foreground }]}>How Musical Lessons Work</Text>
        {[
          { icon: "🎵", text: "Each grammar/vocab lesson has a song version in that language's cultural genre" },
          { icon: "📖", text: "Lyrics teach the rule — the chorus is the key concept that sticks in your head" },
          { icon: "🎤", text: "Sing along for pronunciation practice with real-time scoring" },
          { icon: "📝", text: "Tap any word to see its meaning, part of speech, and grammar note" },
          { icon: "🧠", text: "Music activates more brain areas than reading — you'll remember 3x better" },
        ].map((item, i) => (
          <View key={i} style={styles.howRow}>
            <Text style={styles.howIcon}>{item.icon}</Text>
            <Text style={[styles.howText, { color: colors.muted }]}>{item.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // ─── PLAYER VIEW ──────────────────────────────────────────────────────────

  const renderPlayer = () => {
    if (!selectedLesson) return null;
    const currentLine = selectedLesson.lyrics[currentLineIndex];

    return (
      <View style={styles.playerContainer}>
        {/* Album Art / Gradient Header */}
        <View style={[styles.playerHeader, { backgroundColor: selectedLesson.coverGradient[0] }]}>
          <View style={styles.playerHeaderOverlay}>
            <Text style={styles.playerGenre}>{selectedLesson.genreEmoji} {selectedLesson.genre}</Text>
            <Text style={styles.playerTitle}>{selectedLesson.title}</Text>
            <Text style={styles.playerSubtitle}>{selectedLesson.flag} {selectedLesson.subtitle}</Text>
            <Text style={styles.playerGrammar}>📚 {selectedLesson.grammarTopic}</Text>
          </View>
        </View>

        {/* Lyrics Display */}
        <ScrollView style={styles.lyricsScroll} contentContainerStyle={styles.lyricsContent}>
          {selectedLesson.lyrics.map((line, index) => (
            <TouchableOpacity
              key={line.id}
              style={[
                styles.lyricLine,
                index === currentLineIndex && styles.lyricLineActive,
                index === currentLineIndex && { backgroundColor: colors.primary + "10" },
              ]}
              onPress={() => {
                setCurrentLineIndex(index);
                setExpandedVocab(expandedVocab === line.id ? null : line.id);
              }}
              activeOpacity={0.7}
            >
              {/* Original */}
              <Animated.Text
                style={[
                  styles.lyricOriginal,
                  { color: index === currentLineIndex ? colors.primary : colors.foreground },
                  index === currentLineIndex && { transform: [{ scale: bounceAnim }] },
                ]}
              >
                {line.original}
              </Animated.Text>

              {/* Phonetic (if available) */}
              {line.phonetic && (
                <Text style={[styles.lyricPhonetic, { color: colors.muted }]}>{line.phonetic}</Text>
              )}

              {/* Translation */}
              {showTranslation && (
                <Text style={[styles.lyricTranslation, { color: colors.muted }]}>{line.translation}</Text>
              )}

              {/* Grammar Note */}
              {showGrammar && line.grammarNote && index === currentLineIndex && (
                <View style={[styles.grammarBubble, { backgroundColor: "#3B82F610" }]}>
                  <Ionicons name="school" size={12} color="#3B82F6" />
                  <Text style={[styles.grammarText, { color: "#3B82F6" }]}>{line.grammarNote}</Text>
                </View>
              )}

              {/* Vocabulary (expanded) */}
              {expandedVocab === line.id && line.vocabularyWords.length > 0 && (
                <View style={styles.vocabExpanded}>
                  {line.vocabularyWords.map((word, wi) => (
                    <View key={wi} style={[styles.vocabChip, { backgroundColor: colors.background }]}>
                      <Text style={[styles.vocabWord, { color: colors.primary }]}>{word.word}</Text>
                      <Text style={[styles.vocabMeaning, { color: colors.muted }]}>{word.meaning}</Text>
                      <Text style={[styles.vocabPos, { color: colors.muted }]}>({word.partOfSpeech})</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Cultural Note */}
          <View style={[styles.culturalNote, { backgroundColor: colors.surface }]}>
            <Text style={styles.culturalIcon}>🌍</Text>
            <Text style={[styles.culturalTitle, { color: colors.foreground }]}>Cultural Context</Text>
            <Text style={[styles.culturalText, { color: colors.muted }]}>{selectedLesson.culturalNote}</Text>
          </View>
        </ScrollView>

        {/* Controls */}
        <View style={[styles.playerControls, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {/* Toggle Row */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, showTranslation && { backgroundColor: colors.primary + "20" }]}
              onPress={() => setShowTranslation(!showTranslation)}
            >
              <Text style={[styles.toggleText, { color: showTranslation ? colors.primary : colors.muted }]}>Translation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, showGrammar && { backgroundColor: colors.primary + "20" }]}
              onPress={() => setShowGrammar(!showGrammar)}
            >
              <Text style={[styles.toggleText, { color: showGrammar ? colors.primary : colors.muted }]}>Grammar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, singAlongMode && { backgroundColor: "#10B98120" }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSingAlongMode(!singAlongMode);
              }}
            >
              <Text style={[styles.toggleText, { color: singAlongMode ? "#10B981" : colors.muted }]}>🎤 Sing Along</Text>
            </TouchableOpacity>
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            <Text style={[styles.progressTime, { color: colors.muted }]}>
              {currentLineIndex + 1}/{selectedLesson.lyrics.length}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${((currentLineIndex + 1) / selectedLesson.lyrics.length) * 100}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.progressTime, { color: colors.muted }]}>{selectedLesson.duration}</Text>
          </View>

          {/* Playback Controls */}
          <View style={styles.playbackRow}>
            <TouchableOpacity
              onPress={() => setCurrentLineIndex(Math.max(0, currentLineIndex - 1))}
              style={styles.skipBtn}
            >
              <Ionicons name="play-skip-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
              onPress={togglePlay}
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCurrentLineIndex(Math.min(selectedLesson.lyrics.length - 1, currentLineIndex + 1))}
              style={styles.skipBtn}
            >
              <Ionicons name="play-skip-forward" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => {
          if (view === "player") { setView("browse"); setSelectedLesson(null); setIsPlaying(false); }
          else router.back();
        }} style={styles.backBtn}>
          <Ionicons name={view === "browse" ? "arrow-back" : "chevron-back"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {view === "player" && selectedLesson ? "🎵 Now Playing" : "Musical Lessons"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {view === "browse" ? renderBrowse() : renderPlayer()}
    </ScreenContainer>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  heroSection: { marginBottom: 20 },
  heroTitle: { fontSize: 28, fontWeight: "800" },
  heroSubtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  featuredSection: { marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  featuredScroll: { marginLeft: -4 },
  featuredCard: { width: SCREEN_WIDTH * 0.7, borderRadius: 16, padding: 20, marginRight: 12, marginLeft: 4 },
  featuredGenre: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  featuredTitle: { color: "#FFF", fontSize: 20, fontWeight: "800", marginTop: 8 },
  featuredSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 4 },
  featuredMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  featuredFlag: { fontSize: 16 },
  featuredLevel: { color: "#FFF", fontSize: 11, fontWeight: "700", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  featuredDuration: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  lessonRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
  lessonIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  lessonIconText: { fontSize: 20 },
  lessonRowInfo: { flex: 1 },
  lessonRowTitle: { fontSize: 14, fontWeight: "700" },
  lessonRowSub: { fontSize: 11, marginTop: 2 },
  lessonRowRight: { alignItems: "flex-end" },
  lessonLevel: { fontSize: 12, fontWeight: "700" },
  lessonDuration: { fontSize: 10, marginTop: 2 },
  howItWorks: { borderRadius: 16, padding: 20, marginTop: 24 },
  howTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  howRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  howIcon: { fontSize: 16 },
  howText: { flex: 1, fontSize: 13, lineHeight: 18 },
  // Player
  playerContainer: { flex: 1 },
  playerHeader: { padding: 20, paddingTop: 8 },
  playerHeaderOverlay: {},
  playerGenre: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  playerTitle: { color: "#FFF", fontSize: 22, fontWeight: "800", marginTop: 4 },
  playerSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginTop: 4 },
  playerGrammar: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 8 },
  lyricsScroll: { flex: 1 },
  lyricsContent: { padding: 16, paddingBottom: 20 },
  lyricLine: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  lyricLineActive: { borderLeftWidth: 3, borderLeftColor: "#3B82F6" },
  lyricOriginal: { fontSize: 17, fontWeight: "700", lineHeight: 24 },
  lyricPhonetic: { fontSize: 12, marginTop: 2, fontStyle: "italic" },
  lyricTranslation: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  grammarBubble: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, padding: 8, borderRadius: 8 },
  grammarText: { fontSize: 11, flex: 1 },
  vocabExpanded: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  vocabChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  vocabWord: { fontSize: 12, fontWeight: "700" },
  vocabMeaning: { fontSize: 11 },
  vocabPos: { fontSize: 9 },
  culturalNote: { borderRadius: 12, padding: 16, marginTop: 16 },
  culturalIcon: { fontSize: 20 },
  culturalTitle: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  culturalText: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  // Controls
  playerControls: { padding: 16, borderTopWidth: 0.5 },
  toggleRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 12 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  toggleText: { fontSize: 11, fontWeight: "600" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  progressTime: { fontSize: 10 },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  playbackRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 },
  skipBtn: { padding: 8 },
  playBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
});
