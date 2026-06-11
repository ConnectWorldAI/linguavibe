import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import * as Haptics from 'expo-haptics';
import { useSubscription } from '@/hooks/use-subscription';

const Colors = {
  dark: '#0a0a0f',
  card: '#1a1a2e',
  cardAlt: '#16213e',
  primary: '#6c63ff',
  accent: '#00d4aa',
  gold: '#ffd700',
  pink: '#ff6b9d',
  orange: '#ff8c42',
  cyan: '#00e5ff',
  text: '#ffffff',
  textSecondary: '#a0a0b0',
  border: '#2a2a3e',
  surface: '#12121e',
  error: '#ff4444',
};

type WordCategory = 'nouns' | 'verbs' | 'adjectives' | 'idioms' | 'slang';

interface WordEntry {
  id: string;
  word: string;
  translation: string;
  category: WordCategory;
  gender?: 'masculine' | 'feminine' | 'neutral' | null;
  conjugation?: string[] | null;
  pronunciation?: string;
  examples: string[];
  exampleTranslations?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  lyricContext?: string;
  usageNote?: string;
}

interface GrammarRule {
  id: string;
  rule: string;
  explanation: string;
  pattern: string;
  lyricExample: string;
  lyricTranslation: string;
  additionalExamples: { source: string; translation: string }[];
  level: string;
  tip: string;
}

interface CulturalNote {
  topic: string;
  explanation: string;
  relatedLyric: string;
}

interface SongInfo {
  title: string;
  artist: string;
  detectedLanguage: string;
  dialect?: string;
  estimatedLevel: string;
  genre?: string;
  theme?: string;
}

interface LessonSummary {
  totalWords: number;
  byCategory: Record<string, number>;
  keyTakeaways: string[];
  suggestedPractice: string[];
}

interface BreakdownData {
  songInfo: SongInfo;
  vocabulary: WordEntry[];
  grammarRules: GrammarRule[];
  culturalNotes: CulturalNote[];
  lessonSummary: LessonSummary;
}

const CATEGORIES: { key: WordCategory; label: string; icon: string; color: string }[] = [
  { key: 'nouns', label: 'Nouns', icon: 'cube-outline', color: Colors.cyan },
  { key: 'verbs', label: 'Verbs', icon: 'flash-outline', color: Colors.accent },
  { key: 'adjectives', label: 'Adjectives', icon: 'color-palette-outline', color: Colors.gold },
  { key: 'idioms', label: 'Idioms', icon: 'chatbubble-ellipses-outline', color: Colors.pink },
  { key: 'slang', label: 'Slang', icon: 'flame-outline', color: Colors.orange },
];

type TabView = 'vocabulary' | 'grammar' | 'cultural' | 'quiz';

export default function SongLessonBreakdownScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    artist?: string;
    lyrics?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    dialect?: string;
  }>();

  // State
  const [breakdownData, setBreakdownData] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('vocabulary');
  const [activeCategory, setActiveCategory] = useState<WordCategory | 'all'>('all');
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const [expandedGrammar, setExpandedGrammar] = useState<string | null>(null);

  // Quiz state
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // Manual lyrics input (fallback if no lyrics passed via params)
  const [manualLyrics, setManualLyrics] = useState('');
  const [showLyricsInput, setShowLyricsInput] = useState(false);

  // Premium gating
  const { plan, isPremium } = useSubscription();
  const [showUpgradeWall, setShowUpgradeWall] = useState(false);
  const FREE_VOCAB_LIMIT = 5;
  const FREE_GRAMMAR_LIMIT = 1;

  // tRPC mutations
  const generateBreakdown = trpc.songLesson.generateBreakdown.useMutation();
  const generateQuiz = trpc.songLesson.generateQuiz.useMutation();

  // Load cached breakdown or generate new one
  useEffect(() => {
    loadOrGenerate();
  }, []);

  const loadOrGenerate = async () => {
    // Try to load cached breakdown for this song
    const cacheKey = `@song_breakdown_${params.title || 'unknown'}_${params.artist || 'unknown'}`;
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setBreakdownData(JSON.parse(cached));
        return;
      }
    } catch {}

    // If lyrics are passed, generate immediately
    if (params.lyrics) {
      generateNewBreakdown(params.lyrics);
    } else {
      // Show input for manual lyrics entry
      setShowLyricsInput(true);
    }
  };

  const generateNewBreakdown = async (lyrics: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateBreakdown.mutateAsync({
        lyrics,
        songTitle: params.title,
        artist: params.artist,
        sourceLanguage: params.sourceLanguage || 'Spanish',
        targetLanguage: params.targetLanguage || 'English',
        dialect: params.dialect,
      });

      if (result.success && result.data) {
        setBreakdownData(result.data as BreakdownData);
        // Cache the result
        const cacheKey = `@song_breakdown_${params.title || 'unknown'}_${params.artist || 'unknown'}`;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(result.data));
        setShowLyricsInput(false);
      } else {
        setError(result.error || 'Failed to generate breakdown');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    if (!breakdownData?.vocabulary?.length) return;
    setQuizLoading(true);
    try {
      const result = await generateQuiz.mutateAsync({
        vocabulary: breakdownData.vocabulary.map(v => ({
          word: v.word,
          translation: v.translation,
          category: v.category,
        })),
        quizType: 'mixed',
        questionCount: Math.min(10, breakdownData.vocabulary.length),
        sourceLanguage: breakdownData.songInfo.detectedLanguage || 'Spanish',
        targetLanguage: params.targetLanguage || 'English',
      });

      if (result.success && result.questions.length > 0) {
        setQuizQuestions(result.questions);
        setQuizMode(true);
        setQuizIndex(0);
        setQuizScore(0);
        setShowAnswer(false);
        setSelectedAnswer(null);
      } else {
        // Fallback: generate local quiz from vocabulary
        const localQuiz = generateLocalQuiz(breakdownData.vocabulary);
        setQuizQuestions(localQuiz);
        setQuizMode(true);
        setQuizIndex(0);
        setQuizScore(0);
      }
    } catch {
      // Fallback to local quiz
      const localQuiz = generateLocalQuiz(breakdownData.vocabulary);
      setQuizQuestions(localQuiz);
      setQuizMode(true);
      setQuizIndex(0);
      setQuizScore(0);
    } finally {
      setQuizLoading(false);
    }
  };

  const generateLocalQuiz = (vocab: WordEntry[]) => {
    return vocab.slice(0, 10).map((v, i) => {
      const wrongOptions = vocab
        .filter(w => w.id !== v.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.translation);
      const options = [...wrongOptions, v.translation].sort(() => Math.random() - 0.5);
      return {
        id: i + 1,
        type: 'translation',
        prompt: `What does "${v.word}" mean?`,
        correctAnswer: v.translation,
        options,
        explanation: v.usageNote || `"${v.word}" means "${v.translation}"`,
        relatedWord: v.word,
      };
    });
  };

  const handleQuizAnswer = (answer: string) => {
    if (showAnswer) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAnswer(answer);
    setShowAnswer(true);
    const correct = answer === quizQuestions[quizIndex].correctAnswer;
    if (correct) setQuizScore(s => s + 1);

    setTimeout(() => {
      setShowAnswer(false);
      setSelectedAnswer(null);
      if (quizIndex < quizQuestions.length - 1) {
        setQuizIndex(i => i + 1);
      } else {
        // Quiz complete
        setQuizMode(false);
      }
    }, 2000);
  };

  const handleWordPress = (id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedWord(expandedWord === id ? null : id);
  };

  const handleGrammarPress = (id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedGrammar(expandedGrammar === id ? null : id);
  };

  // Apply premium gating to vocabulary
  const allFilteredWords = breakdownData?.vocabulary
    ? (activeCategory === 'all'
      ? breakdownData.vocabulary
      : breakdownData.vocabulary.filter(w => w.category === activeCategory))
    : [];
  const filteredWords = isPremium ? allFilteredWords : allFilteredWords.slice(0, FREE_VOCAB_LIMIT);
  const hasLockedVocab = !isPremium && allFilteredWords.length > FREE_VOCAB_LIMIT;

  // Apply premium gating to grammar
  const allGrammarRules = breakdownData?.grammarRules || [];
  const visibleGrammarRules = isPremium ? allGrammarRules : allGrammarRules.slice(0, FREE_GRAMMAR_LIMIT);
  const hasLockedGrammar = !isPremium && allGrammarRules.length > FREE_GRAMMAR_LIMIT;

  const categoryCounts = CATEGORIES.map(c => ({
    ...c,
    count: breakdownData?.vocabulary?.filter(w => w.category === c.key).length || 0,
  }));

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'easy': return Colors.accent;
      case 'medium': return Colors.gold;
      case 'hard': return Colors.pink;
      default: return Colors.textSecondary;
    }
  };

  const getGenderBadge = (gender?: string | null) => {
    if (!gender) return null;
    const color = gender === 'feminine' ? Colors.pink : gender === 'masculine' ? Colors.cyan : Colors.textSecondary;
    const label = gender === 'feminine' ? '♀ fem' : gender === 'masculine' ? '♂ masc' : '⚬ neut';
    return (
      <View style={[styles.genderBadge, { backgroundColor: color + '20', borderColor: color }]}>
        <Text style={[styles.genderText, { color }]}>{label}</Text>
      </View>
    );
  };

  // --- RENDER: Loading State ---
  if (loading) {
    return (
      <ScreenContainer containerClassName="bg-[#0a0a0f]">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingTitle}>Analyzing Lyrics...</Text>
          <Text style={styles.loadingSubtitle}>
            Extracting vocabulary, grammar rules, conjugations, and cultural notes
          </Text>
          <View style={styles.loadingSteps}>
            <Text style={styles.loadingStep}>🔍 Identifying nouns, verbs, adjectives...</Text>
            <Text style={styles.loadingStep}>📝 Mapping conjugation patterns...</Text>
            <Text style={styles.loadingStep}>🌍 Detecting dialect & cultural references...</Text>
            <Text style={styles.loadingStep}>📊 Grading difficulty levels...</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // --- RENDER: Lyrics Input (when no lyrics passed) ---
  if (showLyricsInput && !breakdownData) {
    return (
      <ScreenContainer containerClassName="bg-[#0a0a0f]">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Song Breakdown</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.inputContainer} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.inputCard}>
              <Ionicons name="musical-notes" size={40} color={Colors.primary} style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text style={styles.inputTitle}>Paste Song Lyrics</Text>
              <Text style={styles.inputSubtitle}>
                Enter the lyrics of any song and we'll create a complete language lesson from it
              </Text>
              <TextInput
                style={styles.lyricsInput}
                multiline
                placeholder="Paste lyrics here..."
                placeholderTextColor={Colors.textSecondary}
                value={manualLyrics}
                onChangeText={setManualLyrics}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.generateBtn, !manualLyrics.trim() && styles.generateBtnDisabled]}
                onPress={() => manualLyrics.trim() && generateNewBreakdown(manualLyrics.trim())}
                disabled={!manualLyrics.trim()}
              >
                <Ionicons name="sparkles" size={18} color={Colors.text} />
                <Text style={styles.generateBtnText}>Generate Lesson</Text>
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={20} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => setError(null)}>
                  <Ionicons name="close" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  // --- RENDER: Quiz Mode ---
  if (quizMode && quizQuestions.length > 0) {
    const question = quizQuestions[quizIndex];
    return (
      <ScreenContainer containerClassName="bg-[#0a0a0f]">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { setQuizMode(false); }} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Vocabulary Quiz</Text>
            <View style={styles.quizScoreBadge}>
              <Text style={styles.quizScoreText}>{quizScore}/{quizQuestions.length}</Text>
            </View>
          </View>

          <View style={styles.quizContainer}>
            <View style={styles.quizProgress}>
              <View style={[styles.quizProgressBar, { width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }]} />
            </View>

            <View style={styles.quizCard}>
              <Text style={styles.quizType}>{question.type?.toUpperCase() || 'TRANSLATION'}</Text>
              <Text style={styles.quizPrompt}>{question.prompt}</Text>
              {question.relatedWord && (
                <Text style={styles.quizRelated}>Word: {question.relatedWord}</Text>
              )}
            </View>

            <View style={styles.quizOptions}>
              {question.options?.map((opt: string, i: number) => {
                const isCorrect = opt === question.correctAnswer;
                const isSelected = opt === selectedAnswer;
                let optStyle = styles.quizOption;
                if (showAnswer && isCorrect) optStyle = { ...styles.quizOption, ...styles.quizOptionCorrect };
                else if (showAnswer && isSelected && !isCorrect) optStyle = { ...styles.quizOption, ...styles.quizOptionWrong };

                return (
                  <TouchableOpacity
                    key={i}
                    style={optStyle}
                    onPress={() => handleQuizAnswer(opt)}
                    disabled={showAnswer}
                  >
                    <Text style={[
                      styles.quizOptionText,
                      showAnswer && isCorrect && { color: Colors.accent },
                      showAnswer && isSelected && !isCorrect && { color: Colors.error },
                    ]}>{opt}</Text>
                    {showAnswer && isCorrect && <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />}
                    {showAnswer && isSelected && !isCorrect && <Ionicons name="close-circle" size={20} color={Colors.error} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {showAnswer && question.explanation && (
              <View style={styles.explanationCard}>
                <Ionicons name="bulb-outline" size={16} color={Colors.gold} />
                <Text style={styles.explanationText}>{question.explanation}</Text>
              </View>
            )}
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // --- RENDER: Quiz Complete ---
  if (quizMode && quizQuestions.length === 0 && !quizLoading) {
    setQuizMode(false);
  }

  // --- RENDER: Main Breakdown View ---
  return (
    <ScreenContainer containerClassName="bg-[#0a0a0f]">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Song Breakdown</Text>
          <TouchableOpacity
            onPress={() => {
              if (!isPremium) {
                router.push('/payment-setup' as any);
              } else {
                startQuiz();
              }
            }}
            style={styles.quizBtn}
            disabled={quizLoading}
          >
            {quizLoading ? (
              <ActivityIndicator size="small" color={Colors.gold} />
            ) : (
              <View style={{ position: 'relative' }}>
                <Ionicons name="school-outline" size={20} color={Colors.gold} />
                {!isPremium && (
                  <View style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="lock-closed" size={7} color="#000" />
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Song Info Card */}
        {breakdownData?.songInfo && (
          <View style={styles.songInfo}>
            <View style={styles.songIcon}>
              <Ionicons name="musical-notes" size={28} color={Colors.primary} />
            </View>
            <View style={styles.songMeta}>
              <Text style={styles.songTitle}>{breakdownData.songInfo.title || params.title || 'Unknown Song'}</Text>
              <Text style={styles.songArtist}>
                {breakdownData.songInfo.artist || params.artist || 'Unknown Artist'}
                {breakdownData.songInfo.dialect ? ` • ${breakdownData.songInfo.dialect}` : ''}
                {breakdownData.songInfo.estimatedLevel ? ` • ${breakdownData.songInfo.estimatedLevel}` : ''}
              </Text>
              {breakdownData.songInfo.genre && (
                <Text style={styles.songGenre}>{breakdownData.songInfo.genre} • {breakdownData.songInfo.theme}</Text>
              )}
            </View>
          </View>
        )}

        {/* Stats Row */}
        {breakdownData?.lessonSummary && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{breakdownData.lessonSummary.totalWords || breakdownData.vocabulary?.length || 0}</Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
            {categoryCounts.filter(c => c.count > 0).map(c => (
              <View key={c.key} style={styles.statItem}>
                <Text style={[styles.statValue, { color: c.color }]}>{c.count}</Text>
                <Text style={styles.statLabel}>{c.label}</Text>
              </View>
            ))}
            {breakdownData.grammarRules?.length > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.primary }]}>{breakdownData.grammarRules.length}</Text>
                <Text style={styles.statLabel}>Rules</Text>
              </View>
            )}
          </View>
        )}

        {/* Tab Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
          {([
            { key: 'vocabulary' as TabView, label: 'Vocabulary', icon: 'book-outline' },
            { key: 'grammar' as TabView, label: 'Grammar', icon: 'school-outline' },
            { key: 'cultural' as TabView, label: 'Cultural', icon: 'globe-outline' },
          ]).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabChip, activeTab === tab.key && styles.tabChipActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon as any} size={14} color={activeTab === tab.key ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.tabChipText, activeTab === tab.key && styles.tabChipTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Content */}
        {activeTab === 'vocabulary' && (
          <>
            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
              <TouchableOpacity
                style={[styles.filterChip, activeCategory === 'all' && styles.filterChipActive]}
                onPress={() => setActiveCategory('all')}
              >
                <Text style={[styles.filterChipText, activeCategory === 'all' && styles.filterChipTextActive]}>All</Text>
              </TouchableOpacity>
              {CATEGORIES.filter(c => categoryCounts.find(cc => cc.key === c.key)?.count).map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.filterChip, activeCategory === c.key && { backgroundColor: c.color + '30', borderColor: c.color }]}
                  onPress={() => setActiveCategory(c.key)}
                >
                  <Ionicons name={c.icon as any} size={14} color={activeCategory === c.key ? c.color : Colors.textSecondary} />
                  <Text style={[styles.filterChipText, activeCategory === c.key && { color: c.color }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Vocabulary List */}
            <FlatList
              data={filteredWords}
              ListFooterComponent={hasLockedVocab ? (
                <TouchableOpacity
                  style={styles.upgradeCard}
                  onPress={() => router.push('/payment-setup' as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.upgradeIcon}>
                    <Ionicons name="lock-closed" size={24} color={Colors.gold} />
                  </View>
                  <Text style={styles.upgradeTitle}>
                    +{allFilteredWords.length - FREE_VOCAB_LIMIT} more words locked
                  </Text>
                  <Text style={styles.upgradeSubtitle}>
                    Upgrade to Pro for full vocabulary breakdown, conjugation tables, and usage notes
                  </Text>
                  <View style={styles.upgradeBtn}>
                    <Ionicons name="sparkles" size={14} color="#000" />
                    <Text style={styles.upgradeBtnText}>Unlock Full Breakdown</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
              renderItem={({ item }) => {
                const isExpanded = expandedWord === item.id;
                const catInfo = CATEGORIES.find(c => c.key === item.category);
                return (
                  <TouchableOpacity
                    style={[styles.wordCard, isExpanded && styles.wordCardExpanded]}
                    onPress={() => handleWordPress(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.wordHeader}>
                      <View style={styles.wordLeft}>
                        <Text style={styles.wordText}>{item.word}</Text>
                        <Text style={styles.wordTranslation}>{item.translation}</Text>
                      </View>
                      <View style={styles.wordRight}>
                        {getGenderBadge(item.gender)}
                        <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(item.difficulty) }]} />
                        <View style={[styles.categoryChip, { backgroundColor: (catInfo?.color || Colors.primary) + '20' }]}>
                          <Text style={[styles.categoryChipText, { color: catInfo?.color || Colors.primary }]}>{catInfo?.label}</Text>
                        </View>
                      </View>
                    </View>

                    {isExpanded && (
                      <View style={styles.expandedContent}>
                        {/* Pronunciation */}
                        {item.pronunciation && (
                          <View style={styles.pronunciationRow}>
                            <Ionicons name="volume-medium-outline" size={14} color={Colors.primary} />
                            <Text style={styles.pronunciationText}>{item.pronunciation}</Text>
                          </View>
                        )}

                        {/* Lyric Context */}
                        {item.lyricContext && (
                          <View style={styles.lyricContextSection}>
                            <Text style={styles.sectionLabel}>In the Song</Text>
                            <Text style={styles.lyricContextText}>"{item.lyricContext}"</Text>
                          </View>
                        )}

                        {/* Conjugation */}
                        {item.conjugation && item.conjugation.length > 0 && (
                          <View style={styles.conjugationSection}>
                            <Text style={styles.sectionLabel}>Conjugation (Present)</Text>
                            <View style={styles.conjugationGrid}>
                              {['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos'].map((pronoun, i) => (
                                item.conjugation![i] ? (
                                  <View key={i} style={styles.conjugationItem}>
                                    <Text style={styles.pronounText}>{pronoun}</Text>
                                    <Text style={styles.conjugatedText}>{item.conjugation![i]}</Text>
                                  </View>
                                ) : null
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Examples */}
                        <View style={styles.examplesSection}>
                          <Text style={styles.sectionLabel}>Examples</Text>
                          {item.examples.map((ex, i) => (
                            <View key={i} style={styles.exampleRow}>
                              <Text style={styles.exampleBullet}>•</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.exampleText}>{ex}</Text>
                                {item.exampleTranslations?.[i] && (
                                  <Text style={styles.exampleTranslation}>{item.exampleTranslations[i]}</Text>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>

                        {/* Usage Note */}
                        {item.usageNote && (
                          <View style={styles.usageNoteSection}>
                            <Ionicons name="bulb-outline" size={14} color={Colors.gold} />
                            <Text style={styles.usageNoteText}>{item.usageNote}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}

        {activeTab === 'grammar' && (
          <FlatList
            data={visibleGrammarRules}
            ListFooterComponent={hasLockedGrammar ? (
              <TouchableOpacity
                style={styles.upgradeCard}
                onPress={() => router.push('/payment-setup' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.upgradeIcon}>
                  <Ionicons name="lock-closed" size={24} color={Colors.gold} />
                </View>
                <Text style={styles.upgradeTitle}>
                  +{allGrammarRules.length - FREE_GRAMMAR_LIMIT} more grammar rules locked
                </Text>
                <Text style={styles.upgradeSubtitle}>
                  Upgrade to Pro for complete grammar patterns, conjugation rules, and practice tips
                </Text>
                <View style={styles.upgradeBtn}>
                  <Ionicons name="sparkles" size={14} color="#000" />
                  <Text style={styles.upgradeBtnText}>Unlock Full Grammar</Text>
                </View>
              </TouchableOpacity>
            ) : null}
            renderItem={({ item }) => {
              const isExpanded = expandedGrammar === item.id;
              return (
                <TouchableOpacity
                  style={[styles.grammarCard, isExpanded && styles.grammarCardExpanded]}
                  onPress={() => handleGrammarPress(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.grammarHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.grammarRule}>{item.rule}</Text>
                      <Text style={styles.grammarPattern}>{item.pattern}</Text>
                    </View>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>{item.level}</Text>
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <Text style={styles.grammarExplanation}>{item.explanation}</Text>

                      <View style={styles.lyricContextSection}>
                        <Text style={styles.sectionLabel}>From the Song</Text>
                        <Text style={styles.lyricContextText}>"{item.lyricExample}"</Text>
                        <Text style={styles.lyricTranslation}>{item.lyricTranslation}</Text>
                      </View>

                      {item.additionalExamples?.length > 0 && (
                        <View style={styles.examplesSection}>
                          <Text style={styles.sectionLabel}>More Examples</Text>
                          {item.additionalExamples.map((ex, i) => (
                            <View key={i} style={styles.exampleRow}>
                              <Text style={styles.exampleBullet}>•</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.exampleText}>{ex.source}</Text>
                                <Text style={styles.exampleTranslation}>{ex.translation}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {item.tip && (
                        <View style={styles.usageNoteSection}>
                          <Ionicons name="bulb-outline" size={14} color={Colors.gold} />
                          <Text style={styles.usageNoteText}>{item.tip}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="school-outline" size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>No grammar rules extracted</Text>
              </View>
            }
          />
        )}

        {activeTab === 'cultural' && (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {breakdownData?.culturalNotes?.map((note, i) => (
              <View key={i} style={styles.culturalCard}>
                <View style={styles.culturalHeader}>
                  <Ionicons name="globe-outline" size={18} color={Colors.accent} />
                  <Text style={styles.culturalTopic}>{note.topic}</Text>
                </View>
                <Text style={styles.culturalExplanation}>{note.explanation}</Text>
                {note.relatedLyric && (
                  <View style={styles.culturalLyric}>
                    <Ionicons name="musical-note" size={12} color={Colors.primary} />
                    <Text style={styles.culturalLyricText}>"{note.relatedLyric}"</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Key Takeaways */}
            {breakdownData?.lessonSummary?.keyTakeaways?.length > 0 && (
              <View style={styles.takeawaysCard}>
                <Text style={styles.takeawaysTitle}>Key Takeaways</Text>
                {breakdownData!.lessonSummary.keyTakeaways.map((t, i) => (
                  <View key={i} style={styles.takeawayRow}>
                    <Text style={styles.takeawayBullet}>✓</Text>
                    <Text style={styles.takeawayText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Suggested Practice */}
            {breakdownData?.lessonSummary?.suggestedPractice?.length > 0 && (
              <View style={styles.practiceCard}>
                <Text style={styles.practiceTitle}>Suggested Practice</Text>
                {breakdownData!.lessonSummary.suggestedPractice.map((p, i) => (
                  <View key={i} style={styles.practiceRow}>
                    <Text style={styles.practiceBullet}>{i + 1}.</Text>
                    <Text style={styles.practiceText}>{p}</Text>
                  </View>
                ))}
              </View>
            )}

            {(!breakdownData?.culturalNotes || breakdownData.culturalNotes.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons name="globe-outline" size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>No cultural notes available</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Error display */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  quizBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gold + '20', alignItems: 'center', justifyContent: 'center' },
  quizScoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: Colors.gold + '20' },
  quizScoreText: { fontSize: 14, fontWeight: '700', color: Colors.gold },

  // Song Info
  songInfo: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, padding: 16, backgroundColor: Colors.card, borderRadius: 16 },
  songIcon: { width: 52, height: 52, borderRadius: 12, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  songMeta: { marginLeft: 14, flex: 1 },
  songTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  songArtist: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  songGenre: { fontSize: 11, color: Colors.primary, marginTop: 2 },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginBottom: 12, padding: 12, backgroundColor: Colors.surface, borderRadius: 12 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },

  // Tabs
  tabScroll: { maxHeight: 44, marginBottom: 8 },
  tabContent: { paddingHorizontal: 16, gap: 8 },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabChipActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  tabChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabChipTextActive: { color: Colors.primary },

  // Category Filters
  filterScroll: { maxHeight: 40, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary + '30', borderColor: Colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.primary },

  // Word Cards
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  wordCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  wordCardExpanded: { borderColor: Colors.primary + '60' },
  wordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordLeft: { flex: 1 },
  wordText: { fontSize: 17, fontWeight: '700', color: Colors.text },
  wordTranslation: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  wordRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  genderBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  genderText: { fontSize: 10, fontWeight: '600' },
  difficultyDot: { width: 8, height: 8, borderRadius: 4 },
  categoryChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryChipText: { fontSize: 10, fontWeight: '600' },

  // Expanded Content
  expandedContent: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  pronunciationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  pronunciationText: { fontSize: 13, color: Colors.primary, fontStyle: 'italic' },
  lyricContextSection: { marginBottom: 12 },
  lyricContextText: { fontSize: 13, color: Colors.accent, fontStyle: 'italic', lineHeight: 18 },
  lyricTranslation: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  conjugationSection: { marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  conjugationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conjugationItem: { width: '30%', backgroundColor: Colors.surface, borderRadius: 8, padding: 8, alignItems: 'center' },
  pronounText: { fontSize: 10, color: Colors.textSecondary },
  conjugatedText: { fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: 2 },
  examplesSection: { marginBottom: 10 },
  exampleRow: { flexDirection: 'row', marginBottom: 8 },
  exampleBullet: { color: Colors.primary, marginRight: 8, fontSize: 14 },
  exampleText: { fontSize: 13, color: Colors.text, flex: 1, lineHeight: 18 },
  exampleTranslation: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
  usageNoteSection: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, backgroundColor: Colors.gold + '10', borderRadius: 10, marginTop: 4 },
  usageNoteText: { fontSize: 12, color: Colors.gold, flex: 1, lineHeight: 17 },

  // Grammar Cards
  grammarCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  grammarCardExpanded: { borderColor: Colors.primary + '60' },
  grammarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grammarRule: { fontSize: 16, fontWeight: '700', color: Colors.text },
  grammarPattern: { fontSize: 13, color: Colors.primary, marginTop: 3, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  grammarExplanation: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.primary + '20' },
  levelText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  // Cultural Cards
  culturalCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  culturalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  culturalTopic: { fontSize: 16, fontWeight: '700', color: Colors.text },
  culturalExplanation: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  culturalLyric: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  culturalLyricText: { fontSize: 13, color: Colors.primary, fontStyle: 'italic', flex: 1 },

  // Takeaways & Practice
  takeawaysCard: { backgroundColor: Colors.accent + '10', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.accent + '30' },
  takeawaysTitle: { fontSize: 15, fontWeight: '700', color: Colors.accent, marginBottom: 10 },
  takeawayRow: { flexDirection: 'row', marginBottom: 6 },
  takeawayBullet: { color: Colors.accent, marginRight: 8, fontSize: 14 },
  takeawayText: { fontSize: 13, color: Colors.text, flex: 1, lineHeight: 18 },
  practiceCard: { backgroundColor: Colors.primary + '10', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.primary + '30', marginTop: 12 },
  practiceTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 10 },
  practiceRow: { flexDirection: 'row', marginBottom: 6 },
  practiceBullet: { color: Colors.primary, marginRight: 8, fontSize: 14, fontWeight: '700' },
  practiceText: { fontSize: 13, color: Colors.text, flex: 1, lineHeight: 18 },

  // Quiz
  quizContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  quizProgress: { height: 4, backgroundColor: Colors.surface, borderRadius: 2, marginBottom: 24 },
  quizProgressBar: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  quizCard: { alignItems: 'center', padding: 30, backgroundColor: Colors.card, borderRadius: 20, marginBottom: 24 },
  quizType: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 8 },
  quizPrompt: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  quizRelated: { fontSize: 12, color: Colors.primary, marginTop: 8 },
  quizOptions: { gap: 12 },
  quizOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  quizOptionCorrect: { backgroundColor: Colors.accent + '15', borderColor: Colors.accent },
  quizOptionWrong: { backgroundColor: Colors.error + '15', borderColor: Colors.error },
  quizOptionText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  explanationCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, backgroundColor: Colors.gold + '10', borderRadius: 12, marginTop: 16 },
  explanationText: { fontSize: 13, color: Colors.gold, flex: 1, lineHeight: 18 },

  // Loading
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 20 },
  loadingSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  loadingSteps: { marginTop: 30, gap: 12 },
  loadingStep: { fontSize: 13, color: Colors.textSecondary },

  // Input
  inputContainer: { flex: 1, paddingHorizontal: 16 },
  inputCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border },
  inputTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  inputSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  lyricsInput: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginTop: 20, minHeight: 200, color: Colors.text, fontSize: 14, lineHeight: 20, borderWidth: 1, borderColor: Colors.border },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, padding: 16, marginTop: 16 },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: Colors.text },

  // Error
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: Colors.error + '15', borderRadius: 12, marginTop: 16 },
  errorText: { fontSize: 13, color: Colors.error, flex: 1 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: Colors.error + '15', marginHorizontal: 16, borderRadius: 10, position: 'absolute', bottom: 20, left: 0, right: 0 },
  errorBannerText: { fontSize: 12, color: Colors.error, flex: 1 },

  // Empty
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 12 },

  // Upgrade Card (Premium Gate)
  upgradeCard: { alignItems: 'center', padding: 24, backgroundColor: Colors.gold + '08', borderRadius: 16, borderWidth: 1.5, borderColor: Colors.gold + '40', borderStyle: 'dashed', marginTop: 12 },
  upgradeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.gold + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  upgradeTitle: { fontSize: 16, fontWeight: '700', color: Colors.gold, textAlign: 'center' },
  upgradeSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18, paddingHorizontal: 12 },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.gold, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 14 },
  upgradeBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },
});
