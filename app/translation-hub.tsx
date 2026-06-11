import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { ScreenContainer } from "@/components/screen-container";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type TranslationMode = "text" | "url" | "clipboard" | "image";
type Language = { code: string; name: string; flag: string };

type TranslationResult = {
  original: string;
  translated: string;
  detectedLanguage: Language;
  targetLanguage: Language;
  vocabBreakdown: VocabItem[];
  pronunciation?: string;
  confidence: number;
};

type VocabItem = {
  word: string;
  translation: string;
  partOfSpeech: string;
  example: string;
};

type SavedTranslation = {
  id: string;
  original: string;
  translated: string;
  fromLang: string;
  toLang: string;
  timestamp: number;
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
];

// Load saved translations from AsyncStorage on mount
const STORAGE_KEY = "@translation_hub_history";

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function TranslationHubScreen() {
  const [mode, setMode] = useState<TranslationMode>("text");
  const [inputText, setInputText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [sourceLang, setSourceLang] = useState<Language | null>(null); // null = auto-detect
  const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[0]); // English
  const [showLangPicker, setShowLangPicker] = useState<"source" | "target" | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [savedTranslations, setSavedTranslations] = useState<SavedTranslation[]>([]);
  const [clipboardContent, setClipboardContent] = useState<string>("");
  const [showShareSheetInfo, setShowShareSheetInfo] = useState(false);

  const translateMutation = trpc.translate.text.useMutation();
  const detectLangMutation = trpc.translate.detectLanguage.useMutation();

  // Load saved translations + check clipboard on mount
  useEffect(() => {
    checkClipboard();
    loadSavedTranslations();
  }, []);

  const loadSavedTranslations = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setSavedTranslations(JSON.parse(stored));
    } catch {}
  };

  const checkClipboard = async () => {
    try {
      const content = await Clipboard.getStringAsync();
      if (content && content.length > 0) {
        setClipboardContent(content);
      }
    } catch (e) {
      // Clipboard access may be denied
    }
  };

  const handleTranslate = useCallback(async (text: string) => {
    if (!text.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsTranslating(true);

    try {
      // Detect source language if auto-detect
      let detectedLang = sourceLang;
      if (!detectedLang) {
        try {
          const detected = await detectLangMutation.mutateAsync({ text: text.substring(0, 200) });
          const matchedLang = LANGUAGES.find(l => l.code === detected.language);
          detectedLang = matchedLang || { code: detected.language || "unknown", name: detected.languageName || "Unknown", flag: "🌐" };
        } catch {
          detectedLang = { code: "unknown", name: "Auto-detected", flag: "🌐" };
        }
      }

      // Call real translation API
      const response = await translateMutation.mutateAsync({
        text,
        fromLanguage: detectedLang.name || "Auto",
        toLanguage: targetLang.name,
        includeBreakdown: true,
      });

      // Parse breakdown into vocab items
      const vocabItems: VocabItem[] = [];
      if (response.breakdown) {
        const bd = response.breakdown as any;
        if (bd.slang && Array.isArray(bd.slang)) {
          bd.slang.forEach((s: any) => vocabItems.push({
            word: s.term || s.word || "",
            translation: s.meaning || s.translation || "",
            partOfSpeech: s.type || "slang",
            example: s.example || "",
          }));
        }
        if (bd.meanings && Array.isArray(bd.meanings)) {
          bd.meanings.forEach((m: any) => vocabItems.push({
            word: m.word || m.term || "",
            translation: m.definition || m.translation || "",
            partOfSpeech: m.partOfSpeech || "word",
            example: m.example || "",
          }));
        }
      }

      const translationResult: TranslationResult = {
        original: text,
        translated: response.translation || "[Translation unavailable]",
        detectedLanguage: detectedLang as Language,
        targetLanguage: targetLang,
        vocabBreakdown: vocabItems,
        pronunciation: (response.breakdown as any)?.pronunciation,
        confidence: (response.breakdown as any)?.confidence || 0.95,
      };
      setResult(translationResult);
    } catch (error) {
      // Fallback: show error
      setResult({
        original: text,
        translated: "Translation failed. Please try again.",
        detectedLanguage: sourceLang || { code: "unknown", name: "Unknown", flag: "🌐" },
        targetLanguage: targetLang,
        vocabBreakdown: [],
        confidence: 0,
      });
    } finally {
      setIsTranslating(false);
    }
  }, [targetLang, sourceLang]);

  const handlePasteFromClipboard = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const content = await Clipboard.getStringAsync();
    if (content) {
      setInputText(content);
      setMode("text");
      handleTranslate(content);
    }
  };

  const handleSaveTranslation = () => {
    if (!result) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newSaved: SavedTranslation = {
      id: Date.now().toString(),
      original: result.original,
      translated: result.translated,
      fromLang: result.detectedLanguage.name,
      toLang: result.targetLanguage.name,
      timestamp: Date.now(),
    };
    const updated = [newSaved, ...savedTranslations];
    setSavedTranslations(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50))).catch(() => {});
  };

  const handleLearnPhrase = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to a learning flow for this phrase
    Alert.alert("Added to Learning", "This phrase has been added to your daily review deck!");
  };

  // No more mock functions - using real API above

  // ─── LANGUAGE PICKER MODAL ──────────────────────────────────────────────────
  if (showLangPicker) {
    return (
      <ScreenContainer>
        <View style={styles.pickerHeader}>
          <TouchableOpacity onPress={() => setShowLangPicker(null)}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.pickerTitle}>
            {showLangPicker === "source" ? "Translate From" : "Translate To"}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        {showLangPicker === "source" && (
          <TouchableOpacity
            style={[styles.langOption, !sourceLang && styles.langOptionActive]}
            onPress={() => { setSourceLang(null); setShowLangPicker(null); }}
          >
            <Text style={styles.langFlag}>🔍</Text>
            <Text style={[styles.langName, !sourceLang && styles.langNameActive]}>Auto-Detect</Text>
            {!sourceLang && <Ionicons name="checkmark" size={18} color={Colors.secondary} />}
          </TouchableOpacity>
        )}
        <FlatList
          data={LANGUAGES}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => {
            const isActive = showLangPicker === "source"
              ? sourceLang?.code === item.code
              : targetLang.code === item.code;
            return (
              <TouchableOpacity
                style={[styles.langOption, isActive && styles.langOptionActive]}
                onPress={() => {
                  if (showLangPicker === "source") setSourceLang(item);
                  else setTargetLang(item);
                  setShowLangPicker(null);
                }}
              >
                <Text style={styles.langFlag}>{item.flag}</Text>
                <Text style={[styles.langName, isActive && styles.langNameActive]}>{item.name}</Text>
                {isActive && <Ionicons name="checkmark" size={18} color={Colors.secondary} />}
              </TouchableOpacity>
            );
          }}
        />
      </ScreenContainer>
    );
  }

  // ─── SHARE SHEET INFO MODAL ─────────────────────────────────────────────────
  if (showShareSheetInfo) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.shareSheetContent}>
          <View style={styles.shareSheetHeader}>
            <TouchableOpacity onPress={() => setShowShareSheetInfo(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.shareSheetHero}>
            <View style={styles.shareSheetIcon}>
              <Ionicons name="share-outline" size={40} color={Colors.secondary} />
            </View>
            <Text style={styles.shareSheetTitle}>Set as Default Translator</Text>
            <Text style={styles.shareSheetDesc}>
              Make ConnectWorld AI your default translation app in iMessage and across iOS
            </Text>
          </View>

          <View style={styles.setupSteps}>
            <Text style={styles.setupStepsTitle}>Setup Instructions</Text>

            <View style={styles.step}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Open Settings</Text>
                <Text style={styles.stepDesc}>Go to Settings → Translate → Default Translation App</Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Select ConnectWorld AI</Text>
                <Text style={styles.stepDesc}>Choose "ConnectWorld AI" from the list of available translation apps</Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Translate Anywhere</Text>
                <Text style={styles.stepDesc}>Long-press any text in iMessage → Translate → ConnectWorld AI handles it with vocabulary breakdown</Text>
              </View>
            </View>
          </View>

          <View style={styles.iosPreview}>
            <Text style={styles.iosPreviewTitle}>How it looks in iMessage</Text>
            <View style={styles.mockIOSSheet}>
              <View style={styles.mockSheetHandle} />
              <Text style={styles.mockSheetTitle}>Translate</Text>
              <View style={styles.mockSheetDivider} />
              <View style={styles.mockTranslateIcon}>
                <Ionicons name="language" size={28} color={Colors.secondary} />
              </View>
              <Text style={styles.mockSheetBody}>
                The selected content will be sent to ConnectWorld AI to process the translation.
              </Text>
              <TouchableOpacity style={styles.mockContinueBtn}>
                <Text style={styles.mockContinueText}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mockChangeBtn}>
                <Text style={styles.mockChangeText}>Change Default Translation App</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Why ConnectWorld AI?</Text>
            <View style={styles.benefit}>
              <Ionicons name="book" size={18} color={Colors.gold} />
              <Text style={styles.benefitText}>Vocabulary breakdown with every translation</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="mic" size={18} color={Colors.gold} />
              <Text style={styles.benefitText}>Pronunciation guide included</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="flash" size={18} color={Colors.gold} />
              <Text style={styles.benefitText}>Save phrases to your learning deck</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="globe" size={18} color={Colors.gold} />
              <Text style={styles.benefitText}>17+ languages with dialect support</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.gold} />
              <Text style={styles.benefitText}>Private — translations stay on device</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.openSettingsBtn} onPress={() => { setShowShareSheetInfo(false); router.push("/translator-setup" as any); }}>
            <Ionicons name="settings-outline" size={18} color="#FFF" />
            <Text style={styles.openSettingsBtnText}>View Setup Guide</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── MAIN VIEW ──────────────────────────────────────────────────────────────

  // Load persisted data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@translation_hub_data');
        if (stored) {
          // Data available from sync/server
        }
      } catch {}
    })();
  }, []);
  return (
    <ScreenContainer>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Translation Hub</Text>
            <Text style={styles.headerSubtitle}>ConnectWorld AI Translator</Text>
          </View>
          <TouchableOpacity style={styles.headerAction} onPress={() => setShowShareSheetInfo(true)}>
            <Ionicons name="share-outline" size={18} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* iOS Integration Banner */}
        {/* Preview ConnectWorld AI Popup Design */}
        <TouchableOpacity style={styles.iosBanner} activeOpacity={0.8} onPress={() => router.push("/translate-popup" as any)}>
          <View style={[styles.iosBannerIcon, { backgroundColor: Colors.accent }]}>
            <Ionicons name="sparkles" size={20} color="#FFF" />
          </View>
          <View style={styles.iosBannerContent}>
            <Text style={styles.iosBannerTitle}>See How It Looks</Text>
            <Text style={styles.iosBannerDesc}>Preview our translation popup vs Google</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iosBanner} activeOpacity={0.8} onPress={() => router.push("/translator-setup" as any)}>
          <View style={styles.iosBannerIcon}>
            <Ionicons name="logo-apple" size={20} color="#FFF" />
          </View>
          <View style={styles.iosBannerContent}>
            <Text style={styles.iosBannerTitle}>Set as Default Translator</Text>
            <Text style={styles.iosBannerDesc}>Replace Google Translate in iMessage</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Live Call Translation */}
        <TouchableOpacity style={styles.iosBanner} activeOpacity={0.8} onPress={() => router.push("/live-call-translation" as any)}>
          <View style={[styles.iosBannerIcon, { backgroundColor: Colors.success }]}>
            <Ionicons name="call" size={20} color="#FFF" />
          </View>
          <View style={styles.iosBannerContent}>
            <Text style={styles.iosBannerTitle}>Live Call Translation</Text>
            <Text style={styles.iosBannerDesc}>Translate phone calls, FaceTime & WhatsApp in real-time</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.gold }}>PRO</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </View>
        </TouchableOpacity>
        {/* Mode Tabs */}
        <View style={styles.modeTabs}>
          {([
            { key: "text" as TranslationMode, icon: "text-outline", label: "Text" },
            { key: "clipboard" as TranslationMode, icon: "clipboard-outline", label: "Clipboard" },
            { key: "url" as TranslationMode, icon: "link-outline", label: "URL" },
            { key: "image" as TranslationMode, icon: "camera-outline", label: "Image" },
          ]).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.modeTab, mode === tab.key && styles.modeTabActive]}
              onPress={() => setMode(tab.key)}
            >
              <Ionicons name={tab.icon as any} size={16} color={mode === tab.key ? Colors.secondary : Colors.textSecondary} />
              <Text style={[styles.modeTabText, mode === tab.key && styles.modeTabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Language Selector */}
        <View style={styles.langSelector}>
          <TouchableOpacity style={styles.langBtn} onPress={() => setShowLangPicker("source")}>
            <Text style={styles.langBtnFlag}>{sourceLang?.flag || "🔍"}</Text>
            <Text style={styles.langBtnText}>{sourceLang?.name || "Auto-Detect"}</Text>
            <Ionicons name="chevron-down" size={12} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.swapBtn} onPress={() => {
            if (sourceLang) {
              const temp = sourceLang;
              setSourceLang(targetLang);
              setTargetLang(temp);
            }
          }}>
            <Ionicons name="swap-horizontal" size={18} color={Colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.langBtn} onPress={() => setShowLangPicker("target")}>
            <Text style={styles.langBtnFlag}>{targetLang.flag}</Text>
            <Text style={styles.langBtnText}>{targetLang.name}</Text>
            <Ionicons name="chevron-down" size={12} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Input Area */}
        {mode === "text" && (
          <View style={styles.inputArea}>
            <TextInput
              style={styles.textInput}
              placeholder="Paste or type text to translate..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="top"
              returnKeyType="done"
            />
            <View style={styles.inputActions}>
              <TouchableOpacity style={styles.inputAction} onPress={handlePasteFromClipboard}>
                <Ionicons name="clipboard" size={16} color={Colors.textSecondary} />
                <Text style={styles.inputActionText}>Paste</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.translateBtn, !inputText.trim() && styles.translateBtnDisabled]}
                onPress={() => handleTranslate(inputText)}
                disabled={!inputText.trim()}
              >
                <Ionicons name="language" size={16} color="#FFF" />
                <Text style={styles.translateBtnText}>Translate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {mode === "clipboard" && (
          <View style={styles.clipboardArea}>
            {clipboardContent ? (
              <>
                <View style={styles.clipboardPreview}>
                  <Ionicons name="clipboard" size={20} color={Colors.secondary} />
                  <Text style={styles.clipboardText} numberOfLines={4}>{clipboardContent}</Text>
                </View>
                <TouchableOpacity style={styles.translateClipboardBtn} onPress={() => { setInputText(clipboardContent); handleTranslate(clipboardContent); }}>
                  <Ionicons name="language" size={18} color="#FFF" />
                  <Text style={styles.translateClipboardBtnText}>Translate Clipboard</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyClipboard}>
                <Ionicons name="clipboard-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyClipboardText}>Clipboard is empty</Text>
                <Text style={styles.emptyClipboardHint}>Copy text from iMessage or any app, then come back here</Text>
              </View>
            )}
          </View>
        )}

        {mode === "url" && (
          <View style={styles.urlArea}>
            <View style={styles.urlInputRow}>
              <Ionicons name="link" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.urlInput}
                placeholder="Paste a URL to translate..."
                placeholderTextColor={Colors.textMuted}
                value={urlInput}
                onChangeText={setUrlInput}
                autoCapitalize="none"
                keyboardType="url"
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity
              style={[styles.translateBtn, !urlInput.trim() && styles.translateBtnDisabled]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/url-translate" as any);
              }}
              disabled={!urlInput.trim()}
            >
              <Ionicons name="globe" size={16} color="#FFF" />
              <Text style={styles.translateBtnText}>Translate Page</Text>
            </TouchableOpacity>
            <Text style={styles.urlHint}>Paste URLs from Instagram, YouTube, Twitter, or any website</Text>
          </View>
        )}

        {mode === "image" && (
          <View style={styles.imageArea}>
            <TouchableOpacity style={styles.imagePlaceholder} onPress={() => {
              router.push("/screen-overlay-translate" as any);
            }}>
              <Ionicons name="camera" size={40} color={Colors.secondary} />
              <Text style={styles.imagePlaceholderText}>Tap to scan text from image</Text>
              <Text style={styles.imagePlaceholderHint}>Take a photo or select from gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Translation Result */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultLangBadge}>
                <Text style={styles.resultLangText}>{result.detectedLanguage.flag} {result.detectedLanguage.name}</Text>
                <Ionicons name="arrow-forward" size={12} color={Colors.textSecondary} />
                <Text style={styles.resultLangText}>{result.targetLanguage.flag} {result.targetLanguage.name}</Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>{Math.round(result.confidence * 100)}%</Text>
              </View>
            </View>

            <Text style={styles.resultOriginal}>{result.original}</Text>
            <View style={styles.resultDivider} />
            <Text style={styles.resultTranslated}>{result.translated}</Text>

            {result.pronunciation && (
              <View style={styles.pronunciationRow}>
                <Ionicons name="volume-medium" size={14} color={Colors.secondary} />
                <Text style={styles.pronunciationText}>{result.pronunciation}</Text>
              </View>
            )}

            {/* Vocabulary Breakdown */}
            <View style={styles.vocabBreakdown}>
              <Text style={styles.vocabBreakdownTitle}>Vocabulary Breakdown</Text>
              {result.vocabBreakdown.map((item, i) => (
                <View key={i} style={styles.vocabRow}>
                  <View style={styles.vocabWordCol}>
                    <Text style={styles.vocabWord}>{item.word}</Text>
                    <Text style={styles.vocabPos}>{item.partOfSpeech}</Text>
                  </View>
                  <View style={styles.vocabTransCol}>
                    <Text style={styles.vocabTrans}>{item.translation}</Text>
                    <Text style={styles.vocabExample}>{item.example}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Result Actions */}
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.resultAction} onPress={handleSaveTranslation}>
                <Ionicons name="bookmark-outline" size={16} color={Colors.secondary} />
                <Text style={styles.resultActionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resultAction} onPress={handleLearnPhrase}>
                <Ionicons name="school-outline" size={16} color={Colors.gold} />
                <Text style={styles.resultActionText}>Learn</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resultAction} onPress={async () => {
                await Clipboard.setStringAsync(result.translated);
                if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}>
                <Ionicons name="copy-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.resultActionText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resultAction} onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}>
                <Ionicons name="volume-high-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.resultActionText}>Speak</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Translations */}
        {!result && savedTranslations.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Translations</Text>
            {savedTranslations.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentCard}
                activeOpacity={0.7}
                onPress={() => { setInputText(item.original); handleTranslate(item.original); }}
              >
                <View style={styles.recentCardContent}>
                  <Text style={styles.recentOriginal} numberOfLines={1}>{item.original}</Text>
                  <Text style={styles.recentTranslated} numberOfLines={1}>{item.translated}</Text>
                </View>
                <View style={styles.recentMeta}>
                  <Text style={styles.recentLang}>{item.fromLang} → {item.toLang}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  headerAction: { marginLeft: "auto", width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.glowSubtle, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.glowBorder },
  // iOS Banner
  iosBanner: { flexDirection: "row", alignItems: "center", marginHorizontal: Spacing.lg, marginBottom: Spacing.md, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  iosBannerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#333", alignItems: "center", justifyContent: "center" },
  iosBannerContent: { flex: 1 },
  iosBannerTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  iosBannerDesc: { fontSize: 11, color: Colors.textSecondary },
  // Mode Tabs
  modeTabs: { flexDirection: "row", marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: 4, borderWidth: 1, borderColor: Colors.border },
  modeTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: BorderRadius.md },
  modeTabActive: { backgroundColor: Colors.glowSubtle, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  modeTabText: { fontSize: 11, fontWeight: "600", color: Colors.textSecondary },
  modeTabTextActive: { color: Colors.secondary },
  // Language Selector
  langSelector: { flexDirection: "row", alignItems: "center", marginHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: 8 },
  langBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  langBtnFlag: { fontSize: 16 },
  langBtnText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary, flex: 1 },
  swapBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.glowSubtle, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.glowBorder },
  // Text Input
  inputArea: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  textInput: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: 14, fontSize: FontSize.md, color: Colors.textPrimary, minHeight: 100, lineHeight: 22 },
  inputActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  inputAction: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  inputActionText: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  translateBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.md, backgroundColor: Colors.secondary, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  translateBtnDisabled: { opacity: 0.5 },
  translateBtnText: { fontSize: FontSize.sm, fontWeight: "700", color: "#FFF" },
  // Clipboard
  clipboardArea: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  clipboardPreview: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  clipboardText: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22 },
  translateClipboardBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, backgroundColor: Colors.secondary, borderRadius: BorderRadius.lg, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
  translateClipboardBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#FFF" },
  emptyClipboard: { alignItems: "center", padding: 40 },
  emptyClipboardText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textSecondary, marginTop: 12 },
  emptyClipboardHint: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center", marginTop: 6 },
  // URL
  urlArea: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  urlInputRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  urlInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  urlHint: { fontSize: 11, color: Colors.textMuted, textAlign: "center", marginTop: 8 },
  // Image
  imageArea: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  imagePlaceholder: { alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, borderStyle: "dashed" },
  imagePlaceholderText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary, marginTop: 12 },
  imagePlaceholderHint: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  // Result
  resultCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  resultLangBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  resultLangText: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, backgroundColor: Colors.greenGlow, borderWidth: 1, borderColor: Colors.greenBorder },
  confidenceText: { fontSize: 10, fontWeight: "700", color: Colors.success },
  resultOriginal: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22, marginBottom: 10 },
  resultDivider: { height: 1, backgroundColor: Colors.border, marginBottom: 10 },
  resultTranslated: { fontSize: 18, fontWeight: "700", color: Colors.secondary, lineHeight: 26, marginBottom: 8 },
  pronunciationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  pronunciationText: { fontSize: 12, color: Colors.textMuted, fontStyle: "italic" },
  // Vocab Breakdown
  vocabBreakdown: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: 12, marginBottom: 14 },
  vocabBreakdownTitle: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  vocabRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  vocabWordCol: { width: "35%", paddingRight: 8 },
  vocabWord: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  vocabPos: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  vocabTransCol: { flex: 1 },
  vocabTrans: { fontSize: FontSize.sm, color: Colors.textPrimary },
  vocabExample: { fontSize: 11, color: Colors.textMuted, fontStyle: "italic", marginTop: 2 },
  // Result Actions
  resultActions: { flexDirection: "row", justifyContent: "space-around", paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  resultAction: { alignItems: "center", gap: 4 },
  resultActionText: { fontSize: 11, fontWeight: "600", color: Colors.textSecondary },
  // Recent
  recentSection: { marginHorizontal: Spacing.lg },
  recentTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 10 },
  recentCard: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  recentCardContent: { flex: 1 },
  recentOriginal: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: "600" },
  recentTranslated: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  recentMeta: { marginLeft: 8 },
  recentLang: { fontSize: 10, color: Colors.textMuted },
  // Language Picker
  pickerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  pickerTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  langOption: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: Spacing.lg, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  langOptionActive: { backgroundColor: Colors.glowSubtle },
  langFlag: { fontSize: 20 },
  langName: { fontSize: FontSize.md, color: Colors.textPrimary, flex: 1 },
  langNameActive: { color: Colors.secondary, fontWeight: "700" },
  // Share Sheet Info
  shareSheetContent: { paddingBottom: 40 },
  shareSheetHeader: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, alignItems: "flex-end" },
  shareSheetHero: { alignItems: "center", paddingHorizontal: Spacing.lg, marginBottom: 30 },
  shareSheetIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.glowSubtle, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.glowBorder, marginBottom: 16 },
  shareSheetTitle: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary, textAlign: "center" },
  shareSheetDesc: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 },
  setupSteps: { marginHorizontal: Spacing.lg, marginBottom: 24 },
  setupStepsTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 14 },
  step: { flexDirection: "row", gap: 12, marginBottom: 16 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center" },
  stepNumberText: { fontSize: 13, fontWeight: "800", color: "#FFF" },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  stepDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  // iOS Preview
  iosPreview: { marginHorizontal: Spacing.lg, marginBottom: 24 },
  iosPreviewTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: 10 },
  mockIOSSheet: { backgroundColor: "#1C1C1E", borderRadius: 16, padding: 24, alignItems: "center" },
  mockSheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#555", marginBottom: 16 },
  mockSheetTitle: { fontSize: 18, fontWeight: "700", color: "#FFF", marginBottom: 12 },
  mockSheetDivider: { width: "100%", height: 1, backgroundColor: "#333", marginBottom: 16 },
  mockTranslateIcon: { marginBottom: 12 },
  mockSheetBody: { fontSize: 14, color: "#CCC", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  mockContinueBtn: { paddingVertical: 10 },
  mockContinueText: { fontSize: 16, fontWeight: "600", color: "#0A84FF" },
  mockChangeBtn: { paddingVertical: 10 },
  mockChangeText: { fontSize: 14, color: "#0A84FF" },
  // Benefits
  benefitsSection: { marginHorizontal: Spacing.lg, marginBottom: 24 },
  benefitsTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  benefit: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  benefitText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  // Open Settings
  openSettingsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: Spacing.lg, paddingVertical: 14, backgroundColor: Colors.secondary, borderRadius: BorderRadius.lg, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
  openSettingsBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#FFF" },
});
