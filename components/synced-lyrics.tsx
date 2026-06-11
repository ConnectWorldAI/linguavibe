/**
 * Synchronized Lyrics Display
 * 
 * Apple Music-style karaoke view with word-by-word highlighting
 * and dual-language translation overlay for language learning.
 * 
 * Features:
 * - Word-by-word highlight synced to playback time
 * - Dual-language: original lyrics + translation below
 * - Tap any word to see definition/pronunciation
 * - Auto-scroll to current line
 * - Gradient fade at top/bottom edges
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface SyncedWord {
  /** The word in the original language */
  text: string;
  /** Start time in milliseconds */
  startMs: number;
  /** End time in milliseconds */
  endMs: number;
  /** Translation of this specific word */
  translation?: string;
  /** Pronunciation guide (e.g., pinyin, romaji, IPA) */
  pronunciation?: string;
  /** Part of speech */
  partOfSpeech?: string;
  /** Cultural/usage note */
  note?: string;
}

export interface SyncedLine {
  /** Unique line ID */
  id: string;
  /** Words in this line */
  words: SyncedWord[];
  /** Full line translation */
  translation: string;
  /** Line start time (first word start) */
  startMs: number;
  /** Line end time (last word end) */
  endMs: number;
}

export interface SyncedLyricsData {
  /** Song metadata */
  songTitle: string;
  artist: string;
  language: string;
  translationLanguage: string;
  /** All synced lines */
  lines: SyncedLine[];
  /** Total duration in ms */
  durationMs: number;
}

interface SyncedLyricsProps {
  /** The lyrics data with timing info */
  data: SyncedLyricsData;
  /** Current playback position in milliseconds */
  currentTimeMs: number;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Callback when user taps a word */
  onWordTap?: (word: SyncedWord, lineIndex: number) => void;
  /** Show/hide translations */
  showTranslation?: boolean;
  /** Callback when user wants to replay a line */
  onReplayLine?: (line: SyncedLine) => void;
}

// ─── WORD HIGHLIGHT COMPONENT ───────────────────────────────────────────────

const AnimatedText = Animated.createAnimatedComponent(Text);

function HighlightedWord({
  word,
  isActive,
  isPast,
  onTap,
  colors,
}: {
  word: SyncedWord;
  isActive: boolean;
  isPast: boolean;
  onTap: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const opacity = useSharedValue(isPast ? 1 : 0.4);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withTiming(1.05, { duration: 100 });
    } else if (isPast) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 100 });
    } else {
      opacity.value = withTiming(0.4, { duration: 200 });
      scale.value = withTiming(1, { duration: 100 });
    }
  }, [isActive, isPast]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onTap}
      style={({ pressed }) => [
        pressed && { opacity: 0.6 },
      ]}
    >
      <Animated.View style={[animatedStyle, styles.wordContainer]}>
        <Text
          style={[
            styles.wordText,
            {
              color: isActive ? colors.primary : colors.foreground,
              fontWeight: isActive ? "700" : "500",
            },
          ]}
        >
          {word.text}
        </Text>
        {isActive && (
          <View style={[styles.wordUnderline, { backgroundColor: colors.primary }]} />
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── LINE COMPONENT ─────────────────────────────────────────────────────────

function LyricLine({
  line,
  currentTimeMs,
  isCurrentLine,
  showTranslation,
  onWordTap,
  onReplayLine,
  colors,
}: {
  line: SyncedLine;
  currentTimeMs: number;
  isCurrentLine: boolean;
  showTranslation: boolean;
  onWordTap: (word: SyncedWord) => void;
  onReplayLine?: (line: SyncedLine) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const lineOpacity = useSharedValue(isCurrentLine ? 1 : 0.5);

  useEffect(() => {
    lineOpacity.value = withTiming(isCurrentLine ? 1 : 0.5, { duration: 300 });
  }, [isCurrentLine]);

  const lineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: lineOpacity.value,
  }));

  return (
    <Animated.View style={[styles.lineContainer, lineAnimatedStyle]}>
      {/* Original lyrics with word-by-word highlighting */}
      <Pressable
        onLongPress={() => {
          if (onReplayLine) {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            onReplayLine(line);
          }
        }}
        style={styles.lineWordsRow}
      >
        <View style={styles.wordsWrap}>
          {line.words.map((word, idx) => {
            const isActive = currentTimeMs >= word.startMs && currentTimeMs < word.endMs;
            const isPast = currentTimeMs >= word.endMs;
            return (
              <HighlightedWord
                key={`${line.id}-${idx}`}
                word={word}
                isActive={isActive}
                isPast={isPast}
                onTap={() => onWordTap(word)}
                colors={colors}
              />
            );
          })}
        </View>
      </Pressable>

      {/* Translation line */}
      {showTranslation && (
        <Text style={[styles.translationText, { color: colors.muted }]}>
          {line.translation}
        </Text>
      )}
    </Animated.View>
  );
}

// ─── WORD DETAIL MODAL ──────────────────────────────────────────────────────

function WordDetailModal({
  word,
  visible,
  onClose,
  colors,
}: {
  word: SyncedWord | null;
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  if (!word) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* Word */}
          <Text style={[styles.modalWord, { color: colors.foreground }]}>
            {word.text}
          </Text>

          {/* Pronunciation */}
          {word.pronunciation && (
            <Text style={[styles.modalPronunciation, { color: colors.primary }]}>
              {word.pronunciation}
            </Text>
          )}

          {/* Translation */}
          {word.translation && (
            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.muted }]}>
                Translation
              </Text>
              <Text style={[styles.modalValue, { color: colors.foreground }]}>
                {word.translation}
              </Text>
            </View>
          )}

          {/* Part of speech */}
          {word.partOfSpeech && (
            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.muted }]}>
                Type
              </Text>
              <Text style={[styles.modalValue, { color: colors.foreground }]}>
                {word.partOfSpeech}
              </Text>
            </View>
          )}

          {/* Note */}
          {word.note && (
            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.muted }]}>
                Note
              </Text>
              <Text style={[styles.modalValue, { color: colors.foreground }]}>
                {word.note}
              </Text>
            </View>
          )}

          {/* Close hint */}
          <Text style={[styles.modalHint, { color: colors.muted }]}>
            Tap anywhere to close
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export function SyncedLyrics({
  data,
  currentTimeMs,
  isPlaying,
  onWordTap,
  showTranslation = true,
  onReplayLine,
}: SyncedLyricsProps) {
  const colors = useColors();
  const flatListRef = useRef<FlatList>(null);
  const [selectedWord, setSelectedWord] = useState<SyncedWord | null>(null);
  const [showWordModal, setShowWordModal] = useState(false);

  // Find current line index
  const currentLineIndex = useMemo(() => {
    for (let i = data.lines.length - 1; i >= 0; i--) {
      if (currentTimeMs >= data.lines[i].startMs) {
        return i;
      }
    }
    return 0;
  }, [currentTimeMs, data.lines]);

  // Auto-scroll to current line
  useEffect(() => {
    if (isPlaying && flatListRef.current && currentLineIndex >= 0) {
      flatListRef.current.scrollToIndex({
        index: Math.max(0, currentLineIndex - 1),
        animated: true,
        viewPosition: 0.3,
      });
    }
  }, [currentLineIndex, isPlaying]);

  const handleWordTap = useCallback((word: SyncedWord) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedWord(word);
    setShowWordModal(true);
    onWordTap?.(word, currentLineIndex);
  }, [currentLineIndex, onWordTap]);

  const renderLine = useCallback(({ item, index }: { item: SyncedLine; index: number }) => {
    return (
      <LyricLine
        line={item}
        currentTimeMs={currentTimeMs}
        isCurrentLine={index === currentLineIndex}
        showTranslation={showTranslation}
        onWordTap={handleWordTap}
        onReplayLine={onReplayLine}
        colors={colors}
      />
    );
  }, [currentTimeMs, currentLineIndex, showTranslation, handleWordTap, onReplayLine, colors]);

  const keyExtractor = useCallback((item: SyncedLine) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.songTitle, { color: colors.foreground }]}>
          {data.songTitle}
        </Text>
        <Text style={[styles.artistName, { color: colors.muted }]}>
          {data.artist}
        </Text>
        <View style={styles.languageBadges}>
          <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {data.language}
            </Text>
          </View>
          <Text style={[styles.arrow, { color: colors.muted }]}>→</Text>
          <View style={[styles.badge, { backgroundColor: colors.success + "20" }]}>
            <Text style={[styles.badgeText, { color: colors.success }]}>
              {data.translationLanguage}
            </Text>
          </View>
        </View>
      </View>

      {/* Lyrics */}
      <FlatList
        ref={flatListRef}
        data={data.lines}
        renderItem={renderLine}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
      />

      {/* Word detail modal */}
      <WordDetailModal
        word={selectedWord}
        visible={showWordModal}
        onClose={() => setShowWordModal(false)}
        colors={colors}
      />

      {/* Hint */}
      <View style={styles.footer}>
        <Text style={[styles.hintText, { color: colors.muted }]}>
          Tap any word for definition • Long-press line to replay
        </Text>
      </View>
    </View>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  songTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  artistName: {
    fontSize: 14,
    marginTop: 4,
  },
  languageBadges: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  arrow: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  lineContainer: {
    marginVertical: 12,
  },
  lineWordsRow: {
    flexDirection: "row",
  },
  wordsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  wordContainer: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  wordText: {
    fontSize: 22,
    lineHeight: 30,
  },
  wordUnderline: {
    height: 2,
    borderRadius: 1,
    marginTop: 2,
  },
  translationText: {
    fontSize: 14,
    marginTop: 6,
    fontStyle: "italic",
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  hintText: {
    fontSize: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  modalContent: {
    width: Math.min(SCREEN_WIDTH - 60, 320),
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalWord: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalPronunciation: {
    fontSize: 16,
    marginBottom: 16,
  },
  modalRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  modalValue: {
    fontSize: 13,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  modalHint: {
    fontSize: 11,
    marginTop: 16,
  },
});

// ─── DEMO DATA GENERATOR ────────────────────────────────────────────────────

/**
 * Generate demo synced lyrics for testing.
 * In production, this would come from the server after AI-processing a song.
 */
export function generateDemoSyncedLyrics(): SyncedLyricsData {
  return {
    songTitle: "Dákiti",
    artist: "Bad Bunny ft. Jhay Cortez",
    language: "Spanish",
    translationLanguage: "English",
    durationMs: 200000,
    lines: [
      {
        id: "line-1",
        startMs: 15000,
        endMs: 19000,
        translation: "I know you're thinking about me",
        words: [
          { text: "Yo", startMs: 15000, endMs: 15500, translation: "I", pronunciation: "yoh", partOfSpeech: "pronoun" },
          { text: "sé", startMs: 15500, endMs: 16000, translation: "know", pronunciation: "seh", partOfSpeech: "verb" },
          { text: "que", startMs: 16000, endMs: 16300, translation: "that", pronunciation: "keh", partOfSpeech: "conjunction" },
          { text: "tú", startMs: 16300, endMs: 16700, translation: "you", pronunciation: "too", partOfSpeech: "pronoun" },
          { text: "estás", startMs: 16700, endMs: 17200, translation: "are", pronunciation: "eh-STAHS", partOfSpeech: "verb", note: "From 'estar' - temporary state" },
          { text: "pensando", startMs: 17200, endMs: 17800, translation: "thinking", pronunciation: "pen-SAHN-doh", partOfSpeech: "gerund" },
          { text: "en", startMs: 17800, endMs: 18000, translation: "about", pronunciation: "en", partOfSpeech: "preposition" },
          { text: "mí", startMs: 18000, endMs: 19000, translation: "me", pronunciation: "mee", partOfSpeech: "pronoun" },
        ],
      },
      {
        id: "line-2",
        startMs: 19000,
        endMs: 23000,
        translation: "I know you want to be with me",
        words: [
          { text: "Yo", startMs: 19000, endMs: 19400, translation: "I", pronunciation: "yoh", partOfSpeech: "pronoun" },
          { text: "sé", startMs: 19400, endMs: 19800, translation: "know", pronunciation: "seh", partOfSpeech: "verb" },
          { text: "que", startMs: 19800, endMs: 20100, translation: "that", pronunciation: "keh", partOfSpeech: "conjunction" },
          { text: "tú", startMs: 20100, endMs: 20400, translation: "you", pronunciation: "too", partOfSpeech: "pronoun" },
          { text: "quieres", startMs: 20400, endMs: 21000, translation: "want", pronunciation: "kee-EH-res", partOfSpeech: "verb", note: "From 'querer' - to want/love" },
          { text: "estar", startMs: 21000, endMs: 21500, translation: "to be", pronunciation: "eh-STAR", partOfSpeech: "infinitive" },
          { text: "conmigo", startMs: 21500, endMs: 23000, translation: "with me", pronunciation: "kon-MEE-goh", partOfSpeech: "preposition+pronoun", note: "Con + mí = conmigo (special form)" },
        ],
      },
      {
        id: "line-3",
        startMs: 23000,
        endMs: 27000,
        translation: "You don't tell me but I know it well",
        words: [
          { text: "No", startMs: 23000, endMs: 23300, translation: "Not", pronunciation: "noh", partOfSpeech: "adverb" },
          { text: "me", startMs: 23300, endMs: 23600, translation: "me", pronunciation: "meh", partOfSpeech: "pronoun" },
          { text: "lo", startMs: 23600, endMs: 23900, translation: "it", pronunciation: "loh", partOfSpeech: "pronoun" },
          { text: "dices", startMs: 23900, endMs: 24500, translation: "tell", pronunciation: "DEE-ses", partOfSpeech: "verb", note: "From 'decir' - irregular verb" },
          { text: "pero", startMs: 24500, endMs: 25000, translation: "but", pronunciation: "PEH-roh", partOfSpeech: "conjunction" },
          { text: "yo", startMs: 25000, endMs: 25300, translation: "I", pronunciation: "yoh", partOfSpeech: "pronoun" },
          { text: "lo", startMs: 25300, endMs: 25600, translation: "it", pronunciation: "loh", partOfSpeech: "pronoun" },
          { text: "sé", startMs: 25600, endMs: 25900, translation: "know", pronunciation: "seh", partOfSpeech: "verb" },
          { text: "bien", startMs: 25900, endMs: 27000, translation: "well", pronunciation: "bee-EN", partOfSpeech: "adverb" },
        ],
      },
      {
        id: "line-4",
        startMs: 27000,
        endMs: 31000,
        translation: "If you want we can see each other",
        words: [
          { text: "Si", startMs: 27000, endMs: 27400, translation: "If", pronunciation: "see", partOfSpeech: "conjunction" },
          { text: "tú", startMs: 27400, endMs: 27700, translation: "you", pronunciation: "too", partOfSpeech: "pronoun" },
          { text: "quieres", startMs: 27700, endMs: 28300, translation: "want", pronunciation: "kee-EH-res", partOfSpeech: "verb" },
          { text: "podemos", startMs: 28300, endMs: 29000, translation: "we can", pronunciation: "poh-DEH-mos", partOfSpeech: "verb", note: "From 'poder' - nosotros form" },
          { text: "vernos", startMs: 29000, endMs: 31000, translation: "see each other", pronunciation: "BEHR-nos", partOfSpeech: "infinitive+pronoun", note: "Ver + nos = reflexive 'see each other'" },
        ],
      },
      {
        id: "line-5",
        startMs: 31000,
        endMs: 35000,
        translation: "Dákiti, she told me she likes it",
        words: [
          { text: "Dákiti", startMs: 31000, endMs: 32000, translation: "(song title)", pronunciation: "DAH-kee-tee", partOfSpeech: "noun", note: "Named after a beach in Fajardo, Puerto Rico" },
          { text: "ella", startMs: 32000, endMs: 32500, translation: "she", pronunciation: "EH-yah", partOfSpeech: "pronoun" },
          { text: "me", startMs: 32500, endMs: 32800, translation: "me", pronunciation: "meh", partOfSpeech: "pronoun" },
          { text: "dijo", startMs: 32800, endMs: 33400, translation: "told", pronunciation: "DEE-hoh", partOfSpeech: "verb", note: "Past tense of 'decir' - irregular" },
          { text: "que", startMs: 33400, endMs: 33700, translation: "that", pronunciation: "keh", partOfSpeech: "conjunction" },
          { text: "le", startMs: 33700, endMs: 34000, translation: "to her", pronunciation: "leh", partOfSpeech: "pronoun" },
          { text: "gusta", startMs: 34000, endMs: 35000, translation: "likes", pronunciation: "GOOS-tah", partOfSpeech: "verb", note: "'Gustar' works backwards: the thing is the subject" },
        ],
      },
    ],
  };
}
