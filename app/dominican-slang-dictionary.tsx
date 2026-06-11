import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Linking,
  Platform,
  StyleSheet,
  Dimensions,
  Share,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import {
  type SlangEntry,
  getSlangForLanguage,
  getSlangLanguageConfig,
  getAvailableSlangLanguages,
  languageNameToCode,
  getSlangTTSCode,
} from "@/lib/slang-data";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SAVED_KEY = "@slang_saved_ids";
const MASTERED_KEY = "@slang_mastered_ids";
const LANG_PREFS_KEY = "@language_preferences";
const TARGET_LANG_KEY = "@target_language";

// ─── Types ──────────────────────────────────────────────────────────────────

type QuizState = "idle" | "active" | "results";

interface QuizQuestion {
  id: string;
  expression: string;
  correctMeaning: string;
  options: string[];
  correctIndex: number;
}

// ─── Flip Card Component ────────────────────────────────────────────────────

function SlangCard({
  entry,
  colors,
  isSaved,
  isMastered,
  onSpeak,
  onSave,
  onShare,
  languageCode,
  dialect,
}: {
  entry: SlangEntry;
  colors: any;
  isSaved: boolean;
  isMastered: boolean;
  onSpeak: (text: string) => void;
  onSave: (id: string) => void;
  onShare: (entry: SlangEntry) => void;
  languageCode: string;
  dialect?: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const rotation = useSharedValue(0);

  const handleFlip = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newFlipped = !flipped;
    setFlipped(newFlipped);
    rotation.value = withTiming(newFlipped ? 180 : 0, { duration: 300 });
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }],
    backfaceVisibility: "hidden" as const,
    opacity: interpolate(rotation.value, [0, 90, 180], [1, 0, 0]),
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value - 180}deg` }],
    backfaceVisibility: "hidden" as const,
    opacity: interpolate(rotation.value, [0, 90, 180], [0, 0, 1]),
  }));

  return (
    <TouchableOpacity onPress={handleFlip} activeOpacity={0.95} style={styles.cardWrapper}>
      {/* Front */}
      <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, frontStyle]}>
        <View>
          <View style={styles.cardHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40` }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>{entry.category}</Text>
            </View>
            <View style={[styles.formalityBadge, { backgroundColor: `${colors.muted}15` }]}>
              <Text style={[styles.formalityText, { color: colors.muted }]}>{entry.formality}</Text>
            </View>
            {isMastered && (
              <View style={[styles.masteredBadge, { backgroundColor: `${colors.success}15` }]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              </View>
            )}
          </View>
          <Text style={[styles.expression, { color: colors.foreground }]}>{entry.expression}</Text>
          <Text style={[styles.meaning, { color: colors.muted }]}>{entry.meaning}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); onSpeak(entry.expression); }}
            style={[styles.actionBtn, { backgroundColor: `${colors.primary}15` }]}
          >
            <Ionicons name="volume-high" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); onSave(entry.id); }}
            style={[styles.actionBtn, { backgroundColor: isSaved ? `${colors.warning}20` : `${colors.muted}10` }]}
          >
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={16} color={isSaved ? colors.warning : colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); onShare(entry); }}
            style={[styles.actionBtn, { backgroundColor: `${colors.muted}10` }]}
          >
            <Ionicons name="share-outline" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[styles.card, styles.cardBack, { backgroundColor: colors.surface, borderColor: colors.primary }, backStyle]}>
        <View style={styles.backContent}>
          <Text style={[styles.backLabel, { color: colors.primary }]}>LITERAL TRANSLATION</Text>
          <Text style={[styles.backValue, { color: colors.foreground }]}>{entry.literal}</Text>

          <Text style={[styles.backLabel, { color: colors.primary, marginTop: 10 }]}>USAGE</Text>
          <Text style={[styles.backValue, { color: colors.foreground }]}>{entry.usage}</Text>

          {entry.example ? (
            <View style={[styles.exampleBox, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}20` }]}>
              <Text style={[styles.exampleText, { color: colors.foreground }]}>{entry.example}</Text>
              {entry.exampleTranslation && (
                <Text style={[styles.exampleTranslation, { color: colors.muted }]}>{entry.exampleTranslation}</Text>
              )}
            </View>
          ) : null}

          <View style={styles.sourceRow}>
            <Ionicons name="logo-instagram" size={14} color={colors.muted} />
            <Text style={[styles.sourceText, { color: colors.muted }]}>via {entry.source}</Text>
          </View>
        </View>

        <View style={styles.tapHint}>
          <Ionicons name="sync-outline" size={12} color={colors.muted} />
          <Text style={[styles.tapHintText, { color: colors.muted }]}>Tap to flip back</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SlangDictionaryScreen() {
  const router = useRouter();
  const colors = useColors();
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [entries, setEntries] = useState<SlangEntry[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showFilter, setShowFilter] = useState<"all" | "saved" | "new">("all");

  // Language state
  const [languageCode, setLanguageCode] = useState("es");
  const [dialect, setDialect] = useState("dominican");
  const [languageName, setLanguageName] = useState("Spanish");
  const [languageFlag, setLanguageFlag] = useState("\ud83c\udde9\ud83c\uddf4");
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [categories, setCategories] = useState<string[]>(["All"]);

  // Quiz state
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Slang of the Day
  const [slangOfTheDay, setSlangOfTheDay] = useState<SlangEntry | null>(null);

  // Auto-grow: fetch new entries from server
  const slangQuery = trpc.slang.getEntries.useQuery(
    { language: languageName.toLowerCase(), dialect, limit: 200 },
    { enabled: true, retry: 1, refetchOnMount: false }
  );

  const sotdQuery = trpc.slang.slangOfTheDay.useQuery(
    { language: languageName.toLowerCase(), dialect },
    { enabled: true, retry: 1, refetchOnMount: false }
  );

  // Load user's target language on mount
  useEffect(() => {
    loadLanguagePreference();
    loadPersistedState();
  }, []);

  // Update entries when language changes
  useEffect(() => {
    const localEntries = getSlangForLanguage(languageCode, dialect);
    setEntries(localEntries);

    const config = getSlangLanguageConfig(languageCode);
    if (config) {
      setCategories(["All", ...config.categories.filter(c => c !== "All")]);
    }
  }, [languageCode, dialect]);

  // Merge server entries with local
  useEffect(() => {
    if (slangQuery.data?.entries && slangQuery.data.entries.length > 0) {
      const serverEntries: SlangEntry[] = slangQuery.data.entries.map((e: any, i: number) => ({
        id: `server_${languageCode}_${i}_${e.expression?.substring(0, 10) || i}`,
        expression: e.expression,
        literal: e.literal,
        meaning: e.meaning,
        usage: e.usage,
        example: e.example || "",
        exampleTranslation: e.exampleTranslation || "",
        formality: e.formality || "informal",
        category: e.category || "Slang",
        source: e.source || "community",
        audioAvailable: true,
      }));

      const localEntries = getSlangForLanguage(languageCode, dialect);
      const localExpressions = new Set(localEntries.map(e => e.expression.toLowerCase()));
      const newFromServer = serverEntries.filter(e => !localExpressions.has(e.expression.toLowerCase()));
      setEntries([...localEntries, ...newFromServer]);
    }
  }, [slangQuery.data, languageCode, dialect]);

  // Set Slang of the Day
  useEffect(() => {
    if (sotdQuery.data?.entry) {
      const e = sotdQuery.data.entry;
      setSlangOfTheDay({
        id: `sotd_${e.expression}`,
        expression: e.expression,
        literal: e.literal,
        meaning: e.meaning,
        usage: e.usage,
        example: e.example || "",
        exampleTranslation: e.exampleTranslation || "",
        formality: e.formality as any || "informal",
        category: e.category || "Slang",
        source: e.source || "community",
        audioAvailable: true,
      });
    } else {
      // Fallback: pick one from local entries based on day
      const localEntries = getSlangForLanguage(languageCode, dialect);
      if (localEntries.length > 0) {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        setSlangOfTheDay(localEntries[dayOfYear % localEntries.length]);
      }
    }
  }, [sotdQuery.data, languageCode, dialect]);

  const loadLanguagePreference = async () => {
    try {
      // Try @language_preferences first (has targetLanguages array)
      const prefs = await AsyncStorage.getItem(LANG_PREFS_KEY);
      if (prefs) {
        const parsed = JSON.parse(prefs);
        if (parsed.targetLanguages && parsed.targetLanguages.length > 0) {
          const targetLang = parsed.targetLanguages[0];
          const code = languageNameToCode(targetLang);
          setLanguageCode(code);
          setLanguageName(targetLang.charAt(0).toUpperCase() + targetLang.slice(1));

          // Try to get dialect from teacher selection
          const teacherData = await AsyncStorage.getItem("@chosen_teacher");
          if (teacherData) {
            const teacher = JSON.parse(teacherData);
            if (teacher.dialects && teacher.dialects.length > 0) {
              const d = teacher.dialects[0].toLowerCase().replace(/\s+/g, "_");
              setDialect(d.includes("dominican") ? "dominican" : d.includes("mexican") ? "mexican" : d.includes("brazilian") ? "brazilian" : d.includes("british") ? "british" : d.includes("american") ? "american" : "standard");
            }
          }

          // Set flag
          const config = getSlangLanguageConfig(code);
          if (config) setLanguageFlag(config.flag);
          return;
        }
      }

      // Fallback to @target_language
      const targetLang = await AsyncStorage.getItem(TARGET_LANG_KEY);
      if (targetLang) {
        const code = languageNameToCode(targetLang);
        setLanguageCode(code);
        setLanguageName(targetLang.charAt(0).toUpperCase() + targetLang.slice(1));
        const config = getSlangLanguageConfig(code);
        if (config) setLanguageFlag(config.flag);
      }
    } catch (e) {}
  };

  const loadPersistedState = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_KEY);
      if (saved) setSavedIds(new Set(JSON.parse(saved)));
      const mastered = await AsyncStorage.getItem(MASTERED_KEY);
      if (mastered) setMasteredIds(new Set(JSON.parse(mastered)));
    } catch (e) {}
  };

  const persistSaved = async (ids: Set<string>) => {
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify([...ids]));
  };

  const persistMastered = async (ids: Set<string>) => {
    await AsyncStorage.setItem(MASTERED_KEY, JSON.stringify([...ids]));
  };

  const switchLanguage = (code: string, dialectCode?: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLanguageCode(code);
    setDialect(dialectCode || "standard");
    setActiveCategory("All");
    setSearchText("");
    const config = getSlangLanguageConfig(code);
    if (config) {
      setLanguageName(config.languageName);
      setLanguageFlag(config.flag);
    }
    setShowLanguagePicker(false);
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = searchText === "" ||
      entry.expression.toLowerCase().includes(searchText.toLowerCase()) ||
      entry.meaning.toLowerCase().includes(searchText.toLowerCase()) ||
      entry.usage.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = activeCategory === "All" || entry.category === activeCategory;
    const matchesFilter = showFilter === "all" ||
      (showFilter === "saved" && savedIds.has(entry.id)) ||
      (showFilter === "new" && !masteredIds.has(entry.id));
    return matchesSearch && matchesCategory && matchesFilter;
  });

  const handleSpeak = useCallback((text: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const ttsCode = getSlangTTSCode(languageCode, dialect);
      Speech.speak(text, {
        language: ttsCode,
        rate: 0.85,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  }, [isSpeaking, languageCode, dialect]);

  const handleSave = useCallback((id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persistSaved(next);
      return next;
    });
  }, []);

  const handleShare = useCallback(async (entry: SlangEntry) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${languageFlag} ${languageName} Slang: "${entry.expression}"\n\n` +
          `Meaning: ${entry.meaning}\n` +
          `Usage: ${entry.usage}\n` +
          (entry.example ? `Example: ${entry.example}\n(${entry.exampleTranslation})\n\n` : "\n") +
          `\u2014 via ConnectWorld AI`,
      });
    } catch (e) {}
  }, [languageFlag, languageName]);

  // ─── Quiz Logic ────────────────────────────────────────────────────────────

  const generateQuiz = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Quiz from saved expressions (or all if not enough saved)
    const pool = savedIds.size >= 4
      ? entries.filter(e => savedIds.has(e.id))
      : entries;

    if (pool.length < 4) return;

    // Shuffle and pick 10 (or fewer)
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const questionEntries = shuffled.slice(0, Math.min(10, shuffled.length));

    const questions: QuizQuestion[] = questionEntries.map((entry) => {
      const wrongOptions = entries
        .filter(e => e.id !== entry.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(e => e.meaning);

      const options = [...wrongOptions, entry.meaning].sort(() => Math.random() - 0.5);
      const correctIndex = options.indexOf(entry.meaning);

      return {
        id: entry.id,
        expression: entry.expression,
        correctMeaning: entry.meaning,
        options,
        correctIndex,
      };
    });

    setQuizQuestions(questions);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizState("active");
    setShowQuizModal(true);
  };

  const handleQuizAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);

    const isCorrect = index === quizQuestions[currentQuestion].correctIndex;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const qId = quizQuestions[currentQuestion].id;
      setMasteredIds(prev => {
        const next = new Set(prev);
        next.add(qId);
        persistMastered(next);
        return next;
      });
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setQuizState("results");
      }
    }, 1500);
  };

  const renderCard = useCallback(({ item, index }: { item: SlangEntry; index: number }) => (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 400)).duration(300)}>
      <SlangCard
        entry={item}
        colors={colors}
        isSaved={savedIds.has(item.id)}
        isMastered={masteredIds.has(item.id)}
        onSpeak={handleSpeak}
        onSave={handleSave}
        onShare={handleShare}
        languageCode={languageCode}
        dialect={dialect}
      />
    </Animated.View>
  ), [colors, handleSpeak, handleSave, handleShare, savedIds, masteredIds, languageCode, dialect]);

  const savedCount = savedIds.size;
  const masteredCount = masteredIds.size;
  const newCount = entries.filter(e => !masteredIds.has(e.id)).length;
  const availableLanguages = getAvailableSlangLanguages();

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowLanguagePicker(true)}
            style={styles.headerCenter}
          >
            <View style={styles.headerTitleRow}>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>{languageFlag} {languageName} Slang</Text>
              <Ionicons name="chevron-down" size={16} color={colors.muted} />
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              {entries.length} expressions \u2022 {savedCount} saved \u2022 {masteredCount} mastered
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={generateQuiz}
            style={[styles.quizBtn, { backgroundColor: `${colors.success}20` }]}
          >
            <Ionicons name="game-controller" size={16} color={colors.success} />
            <Text style={[styles.quizBtnText, { color: colors.success }]}>Quiz</Text>
          </TouchableOpacity>
        </View>

        {/* Slang of the Day Banner */}
        {slangOfTheDay && (
          <Animated.View entering={FadeIn.duration(500)}>
            <TouchableOpacity
              style={[styles.sotdBanner, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}
              onPress={() => handleSpeak(slangOfTheDay.expression)}
              activeOpacity={0.8}
            >
              <View style={styles.sotdHeader}>
                <Text style={[styles.sotdLabel, { color: colors.primary }]}>{"\ud83c\udf1f"} EXPRESSION OF THE DAY</Text>
                <Ionicons name="volume-high" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.sotdExpression, { color: colors.foreground }]}>{slangOfTheDay.expression}</Text>
              <Text style={[styles.sotdMeaning, { color: colors.muted }]}>{slangOfTheDay.meaning}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Stats & Filter Row */}
        <View style={styles.filterRow}>
          {(["all", "saved", "new"] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFilter(filter);
              }}
              style={[
                styles.filterChip,
                { backgroundColor: showFilter === filter ? colors.primary : colors.surface, borderColor: showFilter === filter ? colors.primary : colors.border },
              ]}
            >
              <Text style={[styles.filterChipText, { color: showFilter === filter ? "#fff" : colors.muted }]}>
                {filter === "all" ? `All (${entries.length})` : filter === "saved" ? `Saved (${savedCount})` : `New (${newCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={`Search ${languageName.toLowerCase()} expressions...`}
            placeholderTextColor={colors.muted}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="done"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          style={styles.categoryList}
          contentContainerStyle={styles.categoryContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveCategory(item);
              }}
              style={[
                styles.categoryChip,
                { backgroundColor: activeCategory === item ? colors.primary : colors.surface, borderColor: activeCategory === item ? colors.primary : colors.border },
              ]}
            >
              <Text style={[styles.categoryChipText, { color: activeCategory === item ? "#fff" : colors.muted }]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Slang Cards List */}
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Animated.View entering={FadeIn.duration(400)} style={[styles.sourceBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sourceBannerTitle, { color: colors.foreground }]}>
                {"\ud83d\udcda"} Auto-Growing Dictionary
              </Text>
              <Text style={[styles.sourceBannerDesc, { color: colors.muted }]}>
                New {languageName.toLowerCase()} expressions are added automatically as our AI discovers content from creators and language teachers. Save expressions and take quizzes to unlock more!
              </Text>
              {languageCode === "es" && (
                <View style={styles.sourceLinks}>
                  <TouchableOpacity
                    style={[styles.sourceLink, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40` }]}
                    onPress={() => Linking.openURL("https://www.instagram.com/spanishovertea")}
                  >
                    <Ionicons name="logo-instagram" size={14} color={colors.primary} />
                    <Text style={[styles.sourceLinkText, { color: colors.primary }]}>@spanishovertea</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sourceLink, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40` }]}
                    onPress={() => Linking.openURL("https://www.instagram.com/bilingueblogs")}
                  >
                    <Ionicons name="logo-instagram" size={14} color={colors.primary} />
                    <Text style={[styles.sourceLinkText, { color: colors.primary }]}>@bilingueblogs</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {showFilter === "saved" ? "No saved expressions yet. Tap the bookmark icon to save!" : `No expressions found for "${searchText}"`}
              </Text>
            </View>
          }
        />

        {/* Language Picker Modal */}
        <Modal visible={showLanguagePicker} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Choose Language</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.pickerSubtitle, { color: colors.muted }]}>
              Select a language to browse its slang and expressions
            </Text>
            <ScrollView style={styles.pickerList}>
              {availableLanguages.map((lang) => {
                const config = getSlangLanguageConfig(lang.code);
                const isActive = lang.code === languageCode;
                return (
                  <View key={lang.code}>
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        { backgroundColor: isActive ? `${colors.primary}10` : colors.surface, borderColor: isActive ? colors.primary : colors.border },
                      ]}
                      onPress={() => switchLanguage(lang.code)}
                    >
                      <Text style={styles.pickerFlag}>{lang.flag}</Text>
                      <View style={styles.pickerItemInfo}>
                        <Text style={[styles.pickerItemName, { color: colors.foreground }]}>{lang.name}</Text>
                        <Text style={[styles.pickerItemCount, { color: colors.muted }]}>{lang.count} expressions</Text>
                      </View>
                      {isActive && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                    </TouchableOpacity>
                    {/* Dialect sub-options */}
                    {isActive && config && config.dialects.length > 1 && (
                      <View style={styles.dialectRow}>
                        {config.dialects.map((d) => (
                          <TouchableOpacity
                            key={d.code}
                            onPress={() => switchLanguage(lang.code, d.code)}
                            style={[
                              styles.dialectChip,
                              { backgroundColor: dialect === d.code ? colors.primary : colors.surface, borderColor: dialect === d.code ? colors.primary : colors.border },
                            ]}
                          >
                            <Text style={[styles.dialectChipText, { color: dialect === d.code ? "#fff" : colors.muted }]}>
                              {d.flag} {d.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </Modal>

        {/* Quiz Modal */}
        <Modal visible={showQuizModal} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.quizContainer, { backgroundColor: colors.background }]}>
            {quizState === "active" && quizQuestions.length > 0 && (
              <>
                <View style={styles.quizHeader}>
                  <TouchableOpacity onPress={() => { setShowQuizModal(false); setQuizState("idle"); }}>
                    <Ionicons name="close" size={24} color={colors.foreground} />
                  </TouchableOpacity>
                  <Text style={[styles.quizProgress, { color: colors.muted }]}>
                    {currentQuestion + 1} / {quizQuestions.length}
                  </Text>
                  <Text style={[styles.quizScoreText, { color: colors.success }]}>
                    {quizScore} correct
                  </Text>
                </View>

                <View style={[styles.quizProgressBar, { backgroundColor: colors.surface }]}>
                  <View style={[styles.quizProgressFill, { width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%`, backgroundColor: colors.primary }]} />
                </View>

                <View style={styles.quizQuestion}>
                  <Text style={[styles.quizLabel, { color: colors.muted }]}>What does this {languageName.toLowerCase()} expression mean?</Text>
                  <Text style={[styles.quizExpression, { color: colors.foreground }]}>
                    "{quizQuestions[currentQuestion].expression}"
                  </Text>
                </View>

                <View style={styles.quizOptions}>
                  {quizQuestions[currentQuestion].options.map((option, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === quizQuestions[currentQuestion].correctIndex;
                    const showResult = selectedAnswer !== null;

                    let optionBg = colors.surface;
                    let optionBorder = colors.border;
                    let optionTextColor = colors.foreground;

                    if (showResult) {
                      if (isCorrect) {
                        optionBg = `${colors.success}20`;
                        optionBorder = colors.success;
                        optionTextColor = colors.success;
                      } else if (isSelected && !isCorrect) {
                        optionBg = `${colors.error}20`;
                        optionBorder = colors.error;
                        optionTextColor = colors.error;
                      }
                    } else if (isSelected) {
                      optionBg = `${colors.primary}20`;
                      optionBorder = colors.primary;
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.quizOption, { backgroundColor: optionBg, borderColor: optionBorder }]}
                        onPress={() => handleQuizAnswer(idx)}
                        disabled={selectedAnswer !== null}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quizOptionText, { color: optionTextColor }]}>{option}</Text>
                        {showResult && isCorrect && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
                        {showResult && isSelected && !isCorrect && <Ionicons name="close-circle" size={20} color={colors.error} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {quizState === "results" && (
              <View style={styles.quizResults}>
                <View style={[styles.quizResultsIcon, { backgroundColor: quizScore >= quizQuestions.length * 0.7 ? `${colors.success}20` : `${colors.warning}20` }]}>
                  <Ionicons
                    name={quizScore >= quizQuestions.length * 0.7 ? "trophy" : "ribbon"}
                    size={48}
                    color={quizScore >= quizQuestions.length * 0.7 ? colors.success : colors.warning}
                  />
                </View>
                <Text style={[styles.quizResultsTitle, { color: colors.foreground }]}>
                  {quizScore >= quizQuestions.length * 0.7 ? "Excellent!" : quizScore >= quizQuestions.length * 0.5 ? "Good Job!" : "Keep Practicing!"}
                </Text>
                <Text style={[styles.quizResultsScore, { color: colors.primary }]}>
                  {quizScore} / {quizQuestions.length}
                </Text>
                <Text style={[styles.quizResultsDesc, { color: colors.muted }]}>
                  {quizScore >= quizQuestions.length * 0.7
                    ? `You've mastered ${quizScore} ${languageName.toLowerCase()} expressions! New slang unlocked.`
                    : "Review your saved expressions and try again to unlock more!"}
                </Text>

                <View style={styles.quizResultsActions}>
                  <TouchableOpacity
                    style={[styles.quizResultsBtn, { backgroundColor: colors.primary }]}
                    onPress={() => { setShowQuizModal(false); setQuizState("idle"); }}
                  >
                    <Text style={styles.quizResultsBtnText}>Back to Dictionary</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quizResultsBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                    onPress={() => { setQuizState("idle"); generateQuiz(); }}
                  >
                    <Text style={[styles.quizResultsBtnText, { color: colors.foreground }]}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  quizBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  quizBtnText: { fontSize: 13, fontWeight: "600" },
  // Slang of the Day
  sotdBanner: { marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  sotdHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sotdLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  sotdExpression: { fontSize: 22, fontWeight: "700", marginTop: 6 },
  sotdMeaning: { fontSize: 14, marginTop: 4 },
  // Filters
  filterRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontWeight: "600" },
  // Search
  searchBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  categoryList: { maxHeight: 44, marginTop: 8 },
  categoryContent: { paddingHorizontal: 16, gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  categoryChipText: { fontSize: 13, fontWeight: "500" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 },
  // Cards
  cardWrapper: { marginBottom: 16, height: 200 },
  card: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, borderWidth: 1, padding: 16, justifyContent: "space-between" },
  cardBack: { borderWidth: 1.5 },
  cardHeader: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  categoryText: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  formalityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  formalityText: { fontSize: 10, fontWeight: "500" },
  masteredBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10 },
  expression: { fontSize: 24, fontWeight: "700", marginTop: 8 },
  meaning: { fontSize: 14, lineHeight: 20 },
  cardActions: { flexDirection: "row", gap: 10 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tapHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, position: "absolute", bottom: 8, right: 12 },
  tapHintText: { fontSize: 10 },
  backContent: { flex: 1 },
  backLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  backValue: { fontSize: 14, marginTop: 2, lineHeight: 20 },
  exampleBox: { marginTop: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  exampleText: { fontSize: 14, fontWeight: "500" },
  exampleTranslation: { fontSize: 12, marginTop: 4, fontStyle: "italic" },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  sourceText: { fontSize: 11 },
  // Source Banner
  sourceBanner: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  sourceBannerTitle: { fontSize: 15, fontWeight: "600" },
  sourceBannerDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  sourceLinks: { flexDirection: "row", gap: 10, marginTop: 10 },
  sourceLink: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  sourceLinkText: { fontSize: 12, fontWeight: "500" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center", paddingHorizontal: 32 },
  // Language Picker
  pickerContainer: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  pickerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  pickerTitle: { fontSize: 24, fontWeight: "700" },
  pickerSubtitle: { fontSize: 14, marginBottom: 20 },
  pickerList: { flex: 1 },
  pickerItem: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10, gap: 14 },
  pickerFlag: { fontSize: 28 },
  pickerItemInfo: { flex: 1 },
  pickerItemName: { fontSize: 16, fontWeight: "600" },
  pickerItemCount: { fontSize: 13, marginTop: 2 },
  dialectRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingLeft: 60, marginBottom: 12, marginTop: -4 },
  dialectChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  dialectChipText: { fontSize: 12, fontWeight: "500" },
  // Quiz
  quizContainer: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  quizHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  quizProgress: { fontSize: 14, fontWeight: "600" },
  quizScoreText: { fontSize: 14, fontWeight: "700" },
  quizProgressBar: { height: 6, borderRadius: 3, marginBottom: 40, overflow: "hidden" },
  quizProgressFill: { height: "100%", borderRadius: 3 },
  quizQuestion: { alignItems: "center", marginBottom: 40 },
  quizLabel: { fontSize: 14, marginBottom: 12 },
  quizExpression: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  quizOptions: { gap: 12 },
  quizOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 14, borderWidth: 1.5 },
  quizOptionText: { fontSize: 15, fontWeight: "500", flex: 1 },
  // Quiz Results
  quizResults: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  quizResultsIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  quizResultsTitle: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  quizResultsScore: { fontSize: 48, fontWeight: "800", marginBottom: 12 },
  quizResultsDesc: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  quizResultsActions: { gap: 12, width: "100%" },
  quizResultsBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  quizResultsBtnText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
