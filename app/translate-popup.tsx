import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";
import { addToReviewQueue } from "@/lib/srs";
import { usePaywallGate } from "@/hooks/use-paywall-gate";
import { PaywallModal } from "@/components/paywall-modal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── TYPES ───────────────────────────────────────────────────────────────────
type WordType = "noun" | "verb" | "adjective" | "adverb" | "preposition" | "pronoun" | "conjunction" | "other";
type FormalityLevel = "formal" | "informal" | "slang" | "neutral";

type TranslatedWord = {
  original: string;
  translated: string;
  type: WordType;
  pronunciation: string;
};

type TranslationResult = {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  formality: FormalityLevel;
  context: string;
  words: TranslatedWord[];
};

// ─── WORD TYPE COLORS ────────────────────────────────────────────────────────
const WORD_COLORS: Record<WordType, string> = {
  noun: "#60A5FA",       // Blue
  verb: "#A78BFA",       // Purple
  adjective: "#34D399",  // Green
  adverb: "#FBBF24",    // Yellow
  preposition: "#F87171", // Red
  pronoun: "#FB923C",   // Orange
  conjunction: "#94A3B8", // Gray
  other: "#CBD5E1",     // Light gray
};

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MOCK_TRANSLATION: TranslationResult = {
  originalText: "Y yo odio pedirle a un hombre. Me gusta que el hombre tome la iniciativa.",
  translatedText: "And I hate asking a man. I like it when the man takes the initiative.",
  sourceLanguage: "Spanish",
  targetLanguage: "English",
  formality: "informal",
  context: "Casual conversation about dating preferences — expressing personal opinion",
  words: [
    { original: "odio", translated: "hate", type: "verb", pronunciation: "OH-dee-oh" },
    { original: "pedirle", translated: "asking (him)", type: "verb", pronunciation: "peh-DEER-leh" },
    { original: "hombre", translated: "man", type: "noun", pronunciation: "OHM-breh" },
    { original: "gusta", translated: "like", type: "verb", pronunciation: "GOO-stah" },
    { original: "tome", translated: "takes", type: "verb", pronunciation: "TOH-meh" },
    { original: "iniciativa", translated: "initiative", type: "noun", pronunciation: "ee-nee-see-ah-TEE-vah" },
  ],
};

const FORMALITY_CONFIG: Record<FormalityLevel, { label: string; color: string; icon: string }> = {
  formal: { label: "Formal", color: "#60A5FA", icon: "briefcase" },
  informal: { label: "Casual", color: "#A78BFA", icon: "chatbubble-ellipses" },
  slang: { label: "Slang", color: "#F59E0B", icon: "flame" },
  neutral: { label: "Neutral", color: "#94A3B8", icon: "remove" },
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function TranslatePopupScreen() {
  const { showPaywall, paywallFeature, singlePrice, checkAccess, dismissPaywall } = usePaywallGate();

  const [showTranslation, setShowTranslation] = useState(false);
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [translation, setTranslation] = useState<TranslationResult>(MOCK_TRANSLATION);
  const translateMutation = trpc.translate.text.useMutation();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wordAnims = useRef(MOCK_TRANSLATION.words.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Start glow pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();

    // Trigger translation after brief delay (simulating tap)
    setTimeout(() => handleTranslate(), 800);
  }, []);

  const handleTranslate = async () => {
    if (!checkAccess("credits", "translation")) return;

    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Use real backend translation
    try {
      const result = await translateMutation.mutateAsync({
        text: MOCK_TRANSLATION.originalText,
        fromLanguage: 'Spanish',
        toLanguage: 'English',
      });
      if ((result as any)?.translatedText) {
        setTranslation(prev => ({ ...prev, translatedText: (result as any).translatedText }));
      }
    } catch {}
    setShowTranslation(true);

    // Animate translation card in
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Stagger word animations
    wordAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: 500 + index * 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSaveWord = (word: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (savedWords.includes(word)) {
      setSavedWords(savedWords.filter(w => w !== word));
    } else {
      setSavedWords([...savedWords, word]);
    }
  };

  const handlePlayPronunciation = (word: TranslatedWord) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(true);
    // Pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setIsPlaying(false), 1500);
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  const formality = FORMALITY_CONFIG[translation.formality];

  return (
    <ScreenContainer>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>ConnectWorld AI</Text>
            <Text style={styles.headerSubtitle}>Translation Popup Preview</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="sparkles" size={14} color={Colors.secondary} />
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={16} color={Colors.secondary} />
          <Text style={styles.infoBannerText}>
            This is how ConnectWorld AI looks when set as your default translator — tap any message to see this instead of Google's plain sheet
          </Text>
        </View>

        {/* Original Message Bubble (simulating iMessage) */}
        <View style={styles.messageBubbleContainer}>
          <View style={styles.messageSender}>
            <View style={styles.senderAvatar}>
              <Text style={styles.senderAvatarText}>R</Text>
            </View>
            <Text style={styles.senderName}>Rohaly</Text>
            <Text style={styles.messageTime}>10:35 AM</Text>
          </View>
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{MOCK_TRANSLATION.originalText}</Text>
            <TouchableOpacity style={styles.translateTrigger} onPress={handleTranslate}>
              <Ionicons name="language" size={14} color={Colors.secondary} />
              <Text style={styles.translateTriggerText}>Tap to translate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CONNECTME AI TRANSLATION POPUP — THE DISTINCTIVE DESIGN          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {showTranslation && (
          <Animated.View style={[styles.translationCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Animated Glow Border */}
            <Animated.View style={[styles.glowBorder, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

            {/* Card Header with branding */}
            <View style={styles.cardHeader}>
              <View style={styles.cardBrand}>
                <View style={styles.brandIcon}>
                  <Ionicons name="sparkles" size={14} color="#FFF" />
                </View>
                <Text style={styles.brandName}>ConnectWorld AI</Text>
              </View>
              <View style={styles.langPair}>
                <Text style={styles.langFlag}>🇪🇸</Text>
                <Ionicons name="arrow-forward" size={12} color={Colors.textMuted} />
                <Text style={styles.langFlag}>🇺🇸</Text>
              </View>
            </View>

            {/* Translated Text with Glow */}
            <View style={styles.translatedSection}>
              <Text style={styles.translatedText}>{translation.translatedText}</Text>
            </View>

            {/* Formality & Context Badge */}
            <View style={styles.contextRow}>
              <View style={[styles.formalityBadge, { backgroundColor: formality.color + "20", borderColor: formality.color + "40" }]}>
                <Ionicons name={formality.icon as any} size={12} color={formality.color} />
                <Text style={[styles.formalityText, { color: formality.color }]}>{formality.label}</Text>
              </View>
              <Text style={styles.contextText}>{translation.context}</Text>
            </View>

            {/* Divider with gradient */}
            <View style={styles.gradientDivider}>
              <View style={styles.gradientDividerLeft} />
              <View style={styles.gradientDividerCenter} />
              <View style={styles.gradientDividerRight} />
            </View>

            {/* Word-by-Word Breakdown with Color Coding */}
            <View style={styles.wordBreakdown}>
              <View style={styles.wordBreakdownHeader}>
                <Text style={styles.wordBreakdownTitle}>Word Breakdown</Text>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: WORD_COLORS.noun }]} />
                  <Text style={styles.legendText}>noun</Text>
                  <View style={[styles.legendDot, { backgroundColor: WORD_COLORS.verb }]} />
                  <Text style={styles.legendText}>verb</Text>
                </View>
              </View>
              {translation.words.map((word, index) => (
                <Animated.View
                  key={word.original}
                  style={[
                    styles.wordRow,
                    {
                      opacity: wordAnims[index],
                      transform: [{ translateX: wordAnims[index].interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
                    },
                  ]}
                >
                  <View style={[styles.wordTypeIndicator, { backgroundColor: WORD_COLORS[word.type] }]} />
                  <View style={styles.wordContent}>
                    <View style={styles.wordPair}>
                      <Text style={[styles.wordOriginal, { color: WORD_COLORS[word.type] }]}>{word.original}</Text>
                      <Ionicons name="arrow-forward" size={10} color={Colors.textMuted} />
                      <Text style={styles.wordTranslated}>{word.translated}</Text>
                    </View>
                    <Text style={styles.wordPronunciation}>{word.pronunciation}</Text>
                  </View>
                  <View style={styles.wordActions}>
                    <TouchableOpacity onPress={() => handlePlayPronunciation(word)} style={styles.wordActionBtn}>
                      <Ionicons name="volume-medium" size={14} color={isPlaying ? Colors.secondary : Colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleSaveWord(word.original)} style={styles.wordActionBtn}>
                      <Ionicons
                        name={savedWords.includes(word.original) ? "bookmark" : "bookmark-outline"}
                        size={14}
                        color={savedWords.includes(word.original) ? Colors.gold : Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.learnBtn} onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                addToReviewQueue(translation.words.map((w) => ({
                  id: `tp_${w.original}`,
                  word: w.original,
                  translation: w.translated,
                  context: translation.originalText,
                  lessonId: "translate-popup",
                })));
              }}>
                <Ionicons name="school" size={16} color="#FFF" />
                <Text style={styles.learnBtnText}>Learn These</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.speakBtn} onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}>
                <Ionicons name="mic" size={16} color={Colors.secondary} />
                <Text style={styles.speakBtnText}>Hear Full</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.copyBtn} onPress={() => {
                if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}>
                <Ionicons name="copy" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Reply Suggestion */}
            <View style={styles.replySuggestion}>
              <Text style={styles.replySuggestionLabel}>Quick reply in Spanish:</Text>
              <TouchableOpacity style={styles.replySuggestionBubble}>
                <Text style={styles.replySuggestionText}>¡Totalmente de acuerdo! 💯</Text>
                <Ionicons name="send" size={12} color={Colors.secondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COMPARISON: Google Translate (plain) vs ConnectWorld AI              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>Google Translate vs ConnectWorld AI</Text>

          {/* Google's version */}
          <View style={styles.googleCard}>
            <View style={styles.googleHeader}>
              <Ionicons name="language" size={18} color="#4285F4" />
              <Text style={styles.googleHeaderText}>Translate</Text>
              <TouchableOpacity style={styles.googleClose}>
                <Ionicons name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.googleBody}>
              The selected content will be sent to Google Translate to process the translation.
            </Text>
            <TouchableOpacity style={styles.googleContinue}>
              <Text style={styles.googleContinueText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.googleChangeText}>Change Default Translation App</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.vsLabel}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* ConnectWorld AI version (mini) */}
          <View style={styles.connectWorldMini}>
            <View style={styles.connectWorldMiniGlow} />
            <View style={styles.connectWorldMiniHeader}>
              <View style={styles.brandIcon}>
                <Ionicons name="sparkles" size={10} color="#FFF" />
              </View>
              <Text style={styles.connectWorldMiniTitle}>ConnectWorld AI</Text>
              <Text style={styles.connectWorldMiniLang}>🇪🇸 → 🇺🇸</Text>
            </View>
            <Text style={styles.connectWorldMiniTranslation}>And I hate asking a man. I like it when the man takes the initiative.</Text>
            <View style={styles.connectWorldMiniWords}>
              <View style={[styles.miniWordChip, { borderColor: WORD_COLORS.verb }]}>
                <Text style={[styles.miniWordText, { color: WORD_COLORS.verb }]}>odio → hate</Text>
              </View>
              <View style={[styles.miniWordChip, { borderColor: WORD_COLORS.noun }]}>
                <Text style={[styles.miniWordText, { color: WORD_COLORS.noun }]}>hombre → man</Text>
              </View>
              <View style={[styles.miniWordChip, { borderColor: WORD_COLORS.noun }]}>
                <Text style={[styles.miniWordText, { color: WORD_COLORS.noun }]}>iniciativa → initiative</Text>
              </View>
            </View>
            <View style={styles.connectWorldMiniActions}>
              <View style={styles.miniActionBtn}>
                <Ionicons name="school" size={11} color="#FFF" />
                <Text style={styles.miniActionText}>Learn</Text>
              </View>
              <View style={styles.miniActionBtn2}>
                <Ionicons name="volume-medium" size={11} color={Colors.secondary} />
                <Text style={styles.miniActionText2}>Hear</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>What Makes Us Different</Text>
          {[
            { icon: "color-palette", title: "Color-Coded Grammar", desc: "Nouns, verbs, adjectives — all visually distinct" },
            { icon: "school", title: "Learn as You Translate", desc: "Save words to your deck with one tap" },
            { icon: "volume-high", title: "Hear Pronunciation", desc: "Native speaker audio for every word" },
            { icon: "chatbubble-ellipses", title: "Context & Formality", desc: "Know if it's slang, formal, or casual" },
            { icon: "flash", title: "Smart Reply Suggestions", desc: "Reply back in their language instantly" },
            { icon: "sparkles", title: "Animated & Beautiful", desc: "Not a boring white sheet — a premium experience" },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={18} color={Colors.secondary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push("/translation-hub" as any)}>
          <Ionicons name="settings" size={18} color="#FFF" />
          <Text style={styles.ctaBtnText}>Set ConnectWorld AI as Default</Text>
        </TouchableOpacity>
      </ScrollView>
    
      <PaywallModal
        visible={showPaywall}
        onClose={dismissPaywall}
        feature={paywallFeature}
        singlePrice={singlePrice}
      />
</ScreenContainer>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  // Header
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  headerBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.glowSubtle, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.glowBorder },
  // Info Banner
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: 12, backgroundColor: Colors.glowSubtle, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.glowBorder },
  infoBannerText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  // Message Bubble
  messageBubbleContainer: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  messageSender: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  senderAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center" },
  senderAvatarText: { fontSize: 12, fontWeight: "700", color: "#FFF" },
  senderName: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  messageTime: { fontSize: 11, color: Colors.textMuted, marginLeft: "auto" },
  messageBubble: { backgroundColor: Colors.surfaceCard, borderRadius: 18, borderTopLeftRadius: 4, padding: 14, borderWidth: 1, borderColor: Colors.border },
  messageText: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 22 },
  translateTrigger: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  translateTriggerText: { fontSize: 12, color: Colors.secondary, fontWeight: "600" },
  // Translation Card
  translationCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, padding: 16, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.glowBorder, overflow: "hidden", position: "relative" },
  glowBorder: { position: "absolute", top: -2, left: -2, right: -2, bottom: -2, borderRadius: BorderRadius.lg + 2, borderWidth: 2, borderColor: Colors.secondary },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  cardBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center", shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 6 },
  brandName: { fontSize: 14, fontWeight: "800", color: Colors.secondary },
  langPair: { flexDirection: "row", alignItems: "center", gap: 6 },
  langFlag: { fontSize: 16 },
  // Translated
  translatedSection: { marginBottom: 12, paddingVertical: 8 },
  translatedText: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary, lineHeight: 24 },
  // Context
  contextRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 14 },
  formalityBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1 },
  formalityText: { fontSize: 10, fontWeight: "700" },
  contextText: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  // Divider
  gradientDivider: { flexDirection: "row", height: 2, marginBottom: 14, borderRadius: 1 },
  gradientDividerLeft: { flex: 1, backgroundColor: Colors.secondary + "60" },
  gradientDividerCenter: { flex: 2, backgroundColor: Colors.secondary },
  gradientDividerRight: { flex: 1, backgroundColor: Colors.secondary + "60" },
  // Word Breakdown
  wordBreakdown: { marginBottom: 14 },
  wordBreakdownHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  wordBreakdownTitle: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: Colors.textMuted },
  wordRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border + "50" },
  wordTypeIndicator: { width: 3, height: 24, borderRadius: 2, marginRight: 10 },
  wordContent: { flex: 1 },
  wordPair: { flexDirection: "row", alignItems: "center", gap: 6 },
  wordOriginal: { fontSize: 14, fontWeight: "700" },
  wordTranslated: { fontSize: 14, color: Colors.textPrimary },
  wordPronunciation: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontStyle: "italic" },
  wordActions: { flexDirection: "row", gap: 8 },
  wordActionBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  // Actions
  actionRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  learnBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, backgroundColor: Colors.secondary, borderRadius: BorderRadius.md, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  learnBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  speakBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, backgroundColor: Colors.glowSubtle, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.glowBorder },
  speakBtnText: { fontSize: 13, fontWeight: "700", color: Colors.secondary },
  copyBtn: { width: 44, alignItems: "center", justifyContent: "center", paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  // Reply Suggestion
  replySuggestion: { paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  replySuggestionLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 6 },
  replySuggestionBubble: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.glowSubtle, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.glowBorder },
  replySuggestionText: { fontSize: 13, color: Colors.textPrimary, fontWeight: "500" },
  // Comparison
  comparisonSection: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  comparisonTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 14, textAlign: "center" },
  googleCard: { backgroundColor: "#2C2C2E", borderRadius: 14, padding: 20, alignItems: "center", marginBottom: 10 },
  googleHeader: { flexDirection: "row", alignItems: "center", gap: 8, width: "100%", marginBottom: 20 },
  googleHeaderText: { fontSize: 17, fontWeight: "600", color: "#FFF", flex: 1, textAlign: "center" },
  googleClose: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#3A3A3C", alignItems: "center", justifyContent: "center" },
  googleBody: { fontSize: 14, color: "#AAA", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  googleContinue: { marginBottom: 12 },
  googleContinueText: { fontSize: 16, color: "#007AFF", fontWeight: "600" },
  googleChangeText: { fontSize: 14, color: "#007AFF" },
  vsLabel: { alignItems: "center", marginVertical: 8 },
  vsText: { fontSize: 12, fontWeight: "800", color: Colors.textMuted, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  // ConnectWorld Mini
  connectWorldMini: { backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: Colors.glowBorder, overflow: "hidden", position: "relative" },
  connectWorldMiniGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: Colors.secondary },
  connectWorldMiniHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginTop: 4 },
  connectWorldMiniTitle: { fontSize: 12, fontWeight: "800", color: Colors.secondary },
  connectWorldMiniLang: { fontSize: 12, marginLeft: "auto" },
  connectWorldMiniTranslation: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary, lineHeight: 20, marginBottom: 8 },
  connectWorldMiniWords: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  miniWordChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, backgroundColor: Colors.primary },
  miniWordText: { fontSize: 11, fontWeight: "600" },
  connectWorldMiniActions: { flexDirection: "row", gap: 8 },
  miniActionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.secondary, borderRadius: 6 },
  miniActionText: { fontSize: 11, fontWeight: "700", color: "#FFF" },
  miniActionBtn2: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.glowSubtle, borderRadius: 6, borderWidth: 1, borderColor: Colors.glowBorder },
  miniActionText2: { fontSize: 11, fontWeight: "700", color: Colors.secondary },
  // Features
  featuresSection: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  featuresTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 14 },
  featureRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.glowSubtle, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.glowBorder },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  featureDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  // CTA
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: Spacing.lg, paddingVertical: 16, backgroundColor: Colors.secondary, borderRadius: BorderRadius.lg, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 10 },
  ctaBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#FFF" },
});
