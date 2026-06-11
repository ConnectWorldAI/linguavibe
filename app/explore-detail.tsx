import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

type SubtitleLine = {
  id: string;
  timestamp: string;
  original: string;
  translated: string;
  words: { word: string; translation: string; partOfSpeech: string }[];
};

// Mock subtitle data representing dual-language content
const MOCK_SUBTITLES: Record<string, SubtitleLine[]> = {
  "1": [
    { id: "s1", timestamp: "0:02", original: "¿Qué lo que, manito?", translated: "What's up, bro?", words: [{ word: "Qué lo que", translation: "What's up (Dominican greeting)", partOfSpeech: "phrase" }, { word: "manito", translation: "bro / little brother", partOfSpeech: "noun" }] },
    { id: "s2", timestamp: "0:05", original: "Dime a ver, ¿tú eres de aquí?", translated: "Tell me, are you from here?", words: [{ word: "Dime a ver", translation: "Tell me / Go ahead", partOfSpeech: "phrase" }, { word: "de aquí", translation: "from here", partOfSpeech: "adverb" }] },
    { id: "s3", timestamp: "0:09", original: "Claro que sí, yo soy de Villa Mella", translated: "Of course, I'm from Villa Mella", words: [{ word: "Claro que sí", translation: "Of course / Obviously", partOfSpeech: "phrase" }, { word: "Villa Mella", translation: "Neighborhood in Santo Domingo", partOfSpeech: "proper noun" }] },
    { id: "s4", timestamp: "0:13", original: "Eso ta' duro, loco", translated: "That's fire, dude", words: [{ word: "ta' duro", translation: "is hard / is fire (slang: cool)", partOfSpeech: "adjective" }, { word: "loco", translation: "dude / crazy one", partOfSpeech: "noun" }] },
    { id: "s5", timestamp: "0:16", original: "Vamo' a janguear por el malecón", translated: "Let's hang out at the boardwalk", words: [{ word: "Vamo'", translation: "Let's go (shortened vamos)", partOfSpeech: "verb" }, { word: "janguear", translation: "to hang out (from English 'hang')", partOfSpeech: "verb" }, { word: "malecón", translation: "boardwalk / seaside promenade", partOfSpeech: "noun" }] },
    { id: "s6", timestamp: "0:20", original: "Dale, pero primero vamo' a comer un chimichurri", translated: "Bet, but first let's eat a chimichurri sandwich", words: [{ word: "Dale", translation: "Bet / OK / Let's do it", partOfSpeech: "interjection" }, { word: "chimichurri", translation: "Dominican street burger/sandwich", partOfSpeech: "noun" }] },
  ],
  "2": [
    { id: "s1", timestamp: "0:01", original: "Wesh, ça va ou quoi?", translated: "Yo, how's it going?", words: [{ word: "Wesh", translation: "Yo / Hey (Paris slang)", partOfSpeech: "interjection" }, { word: "ça va", translation: "how are you / it's going", partOfSpeech: "phrase" }] },
    { id: "s2", timestamp: "0:04", original: "Tranquille, je suis en mode chill", translated: "Chill, I'm in relax mode", words: [{ word: "Tranquille", translation: "Chill / Relaxed", partOfSpeech: "adjective" }, { word: "en mode", translation: "in mode / vibing", partOfSpeech: "phrase" }] },
    { id: "s3", timestamp: "0:07", original: "C'est chanmé ce truc!", translated: "This thing is crazy!", words: [{ word: "chanmé", translation: "crazy / amazing (verlan for méchant)", partOfSpeech: "adjective" }, { word: "truc", translation: "thing / stuff", partOfSpeech: "noun" }] },
    { id: "s4", timestamp: "0:10", original: "Grave, c'est trop stylé", translated: "For real, it's too stylish", words: [{ word: "Grave", translation: "For real / Seriously", partOfSpeech: "adverb" }, { word: "stylé", translation: "stylish / cool", partOfSpeech: "adjective" }] },
  ],
  default: [
    { id: "s1", timestamp: "0:01", original: "Content in original language", translated: "Content translated to your language", words: [{ word: "Content", translation: "Content / Material", partOfSpeech: "noun" }] },
    { id: "s2", timestamp: "0:04", original: "More phrases to learn here", translated: "More phrases to learn here", words: [{ word: "phrases", translation: "phrases / expressions", partOfSpeech: "noun" }] },
  ],
};

// Content metadata from the Explore grid
const CONTENT_META: Record<string, { flag: string; language: string; caption: string; views: string; creator: string; duration: string }> = {
  "1": { flag: "🇩🇴", language: "Dominican Spanish", caption: "Dime a ver — street interview Santo Domingo", views: "45K", creator: "@santodomingo_real", duration: "1:24" },
  "2": { flag: "🇫🇷", language: "French", caption: "Paris slang you won't learn in school", views: "128K", creator: "@parisverlan", duration: "2:15" },
  "3": { flag: "🇯🇵", language: "Japanese", caption: "Tokyo convenience store phrases", views: "89K", creator: "@tokyo_daily", duration: "1:48" },
  "4": { flag: "🇨🇴", language: "Colombian Spanish", caption: "LIVE: Medellín street food tour", views: "2.1K watching", creator: "@medellin_eats", duration: "LIVE" },
  "5": { flag: "🇳🇬", language: "Yoruba", caption: "Nigerian pidgin vs Yoruba — know the difference", views: "67K", creator: "@naija_tongue", duration: "3:02" },
  "6": { flag: "🇰🇷", language: "Korean", caption: "K-drama phrases that hit different", views: "234K", creator: "@kdrama_korean", duration: "2:45" },
  "7": { flag: "🇧🇷", language: "Brazilian Portuguese", caption: "Funk carioca lyrics decoded", views: "156K", creator: "@funk_decoded", duration: "2:30" },
  "8": { flag: "🇲🇽", language: "Mexican Spanish", caption: "CDMX market haggling 101", views: "91K", creator: "@cdmx_life", duration: "1:55" },
};

export default function ExploreDetailScreen() {
  const params = useLocalSearchParams<{ id: string; flag?: string; language?: string; caption?: string }>();
  const contentId = params.id || "1";
  const meta = CONTENT_META[contentId] || { flag: params.flag || "🌍", language: params.language || "Unknown", caption: params.caption || "Content", views: "—", creator: "@creator", duration: "—" };
  const subtitles = MOCK_SUBTITLES[contentId] || MOCK_SUBTITLES["default"];

  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const [savedPhrases, setSavedPhrases] = useState<Set<string>>(new Set());
  const [showTranslation, setShowTranslation] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 0.75 | 1>(1);

  const handleSavePhrase = useCallback(async (lineId: string, original: string, translated: string) => {
    const newSaved = new Set(savedPhrases);
    if (newSaved.has(lineId)) {
      newSaved.delete(lineId);
    } else {
      newSaved.add(lineId);
      // Persist to AsyncStorage
      try {
        const existing = await AsyncStorage.getItem("@saved_phrases");
        const phrases = existing ? JSON.parse(existing) : [];
        phrases.push({ original, translated, language: meta.language, savedAt: new Date().toISOString() });
        await AsyncStorage.setItem("@saved_phrases", JSON.stringify(phrases));
      } catch (e) {
        // Silent fail
      }
    }
    setSavedPhrases(newSaved);
    if (Platform.OS !== "web") {
      const Haptics = require("expo-haptics");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [savedPhrases, meta.language]);

  const handleWordPress = (word: string, translation: string, partOfSpeech: string) => {
    Alert.alert(
      word,
      `${translation}\n\nPart of speech: ${partOfSpeech}`,
      [
        { text: "Save to Vocab", onPress: () => {} },
        { text: "Close", style: "cancel" },
      ]
    );
  };

  const toggleSpeed = () => {
    setPlaybackSpeed((prev) => {
      if (prev === 1) return 0.75;
      if (prev === 0.75) return 0.5;
      return 1;
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerFlag}>{meta.flag}</Text>
          <Text style={styles.headerLanguage}>{meta.language}</Text>
        </View>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Video Player Area (placeholder) */}
      <View style={styles.videoContainer}>
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoFlag}>{meta.flag}</Text>
          <View style={styles.playButtonLarge}>
            <Ionicons name="play" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.videoDuration}>{meta.duration}</Text>
        </View>
        {/* Playback controls */}
        <View style={styles.playbackControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleSpeed}>
            <Text style={styles.speedText}>{playbackSpeed}x</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, showTranslation && styles.controlButtonActive]}
            onPress={() => setShowTranslation(!showTranslation)}
          >
            <Ionicons name="language" size={16} color={showTranslation ? Colors.secondary : Colors.textMuted} />
            <Text style={[styles.controlLabel, showTranslation && styles.controlLabelActive]}>Dual</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="repeat" size={16} color={Colors.textMuted} />
            <Text style={styles.controlLabel}>Loop</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonActive]}
            onPress={() => router.push({
              pathname: "/lyrics-player",
              params: {
                title: meta.caption || "Entertainment",
                artist: meta.creator || "Video",
                language: meta.language || "French",
                targetLanguage: "English",
                mode: "entertainment",
              },
            })}
          >
            <Ionicons name="text" size={16} color={Colors.secondary} />
            <Text style={[styles.controlLabel, styles.controlLabelActive]}>Synced</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Info */}
      <View style={styles.contentInfo}>
        <Text style={styles.contentCaption}>{meta.caption}</Text>
        <View style={styles.contentMeta}>
          <Text style={styles.creatorText}>{meta.creator}</Text>
          <Text style={styles.viewsText}>{meta.views} views</Text>
        </View>
      </View>

      {/* Subtitle Lines */}
      <ScrollView style={styles.subtitleScroll} contentContainerStyle={styles.subtitleContent}>
        <View style={styles.sectionHeader}>
          <Ionicons name="text" size={16} color={Colors.secondary} />
          <Text style={styles.sectionTitle}>Dual-Language Subtitles</Text>
          <View style={styles.savedCount}>
            <Ionicons name="bookmark" size={12} color={Colors.gold} />
            <Text style={styles.savedCountText}>{savedPhrases.size}</Text>
          </View>
        </View>

        {subtitles.map((line) => {
          const isExpanded = expandedLine === line.id;
          const isSaved = savedPhrases.has(line.id);

          return (
            <TouchableOpacity
              key={line.id}
              style={[styles.subtitleLine, isExpanded && styles.subtitleLineExpanded, isSaved && styles.subtitleLineSaved]}
              activeOpacity={0.8}
              onPress={() => setExpandedLine(isExpanded ? null : line.id)}
            >
              {/* Timestamp */}
              <View style={styles.timestampBadge}>
                <Text style={styles.timestampText}>{line.timestamp}</Text>
              </View>

              {/* Original text */}
              <Text style={styles.originalText}>{line.original}</Text>

              {/* Translated text */}
              {showTranslation && (
                <Text style={styles.translatedText}>{line.translated}</Text>
              )}

              {/* Expanded: word-by-word breakdown */}
              {isExpanded && (
                <View style={styles.wordBreakdown}>
                  <Text style={styles.breakdownTitle}>Word-by-Word:</Text>
                  <View style={styles.wordGrid}>
                    {line.words.map((w, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.wordChip}
                        onPress={() => handleWordPress(w.word, w.translation, w.partOfSpeech)}
                      >
                        <Text style={styles.wordOriginal}>{w.word}</Text>
                        <Text style={styles.wordTranslation}>{w.translation}</Text>
                        <Text style={styles.wordPos}>{w.partOfSpeech}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Save Phrase Button */}
              <TouchableOpacity
                style={[styles.saveButton, isSaved && styles.saveButtonActive]}
                onPress={() => handleSavePhrase(line.id, line.original, line.translated)}
              >
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={16}
                  color={isSaved ? Colors.gold : Colors.textSecondary}
                />
                <Text style={[styles.saveText, isSaved && styles.saveTextActive]}>
                  {isSaved ? "Saved" : "Save Phrase"}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {/* Bottom CTA */}
        <View style={styles.bottomCta}>
          <TouchableOpacity style={styles.practiceButton} onPress={() => {
            const firstLine = subtitles[0];
            router.push({
              pathname: "/practice-pronunciation" as any,
              params: {
                phrase: firstLine?.original || "¿Qué lo que, manito?",
                translation: firstLine?.translated || "What's up, bro?",
                language: meta.language,
                flag: meta.flag,
              },
            });
          }}>
            <Ionicons name="mic" size={18} color={Colors.primary} />
            <Text style={styles.practiceText}>Practice Pronunciation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.lessonButton}>
            <Ionicons name="school" size={18} color={Colors.secondary} />
            <Text style={styles.lessonText}>Generate Mini-Lesson</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerFlag: {
    fontSize: 20,
  },
  headerLanguage: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  videoContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  videoPlaceholder: {
    width: "100%",
    height: width * 0.5,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    overflow: "hidden",
  },
  videoFlag: {
    fontSize: 48,
    position: "absolute",
    opacity: 0.15,
  },
  playButtonLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 170, 255, 0.3)",
    borderWidth: 2,
    borderColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  videoDuration: {
    position: "absolute",
    bottom: 12,
    right: 12,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playbackControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: Spacing.sm,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  controlButtonActive: {
    borderColor: Colors.glowBorder,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
  },
  speedText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gold,
  },
  controlLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  controlLabelActive: {
    color: Colors.secondary,
  },
  contentInfo: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  contentCaption: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  contentMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  creatorText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "500",
  },
  viewsText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  subtitleScroll: {
    flex: 1,
  },
  subtitleContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  savedCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 184, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  savedCountText: {
    fontSize: FontSize.xs,
    color: Colors.gold,
    fontWeight: "600",
  },
  subtitleLine: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  subtitleLineExpanded: {
    borderColor: Colors.glowBorder,
    backgroundColor: "rgba(0, 170, 255, 0.04)",
  },
  subtitleLineSaved: {
    borderColor: Colors.goldBorder,
  },
  timestampBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 170, 255, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timestampText: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: "600",
  },
  originalText: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
    paddingRight: 40,
  },
  translatedText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 8,
  },
  wordBreakdown: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  breakdownTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  wordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  wordChip: {
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.15)",
  },
  wordOriginal: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  wordTranslation: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  wordPos: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 1,
    fontStyle: "italic",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  saveButtonActive: {
    backgroundColor: "rgba(255, 184, 0, 0.1)",
    borderColor: Colors.goldBorder,
  },
  saveText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  saveTextActive: {
    color: Colors.gold,
  },
  bottomCta: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  practiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  practiceText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  lessonButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surfaceCard,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  lessonText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.secondary,
  },
});
