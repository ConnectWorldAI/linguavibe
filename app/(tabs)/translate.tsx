import { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Platform,
  Share,
  Modal,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import { trpc } from "@/lib/trpc";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../../constants/Colors";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { setAudioModeAsync, createAudioPlayer, AudioPlayer } from "expo-audio";
import Svg, { Path } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { captureRef } from "react-native-view-shot";
let ImagePicker: any;
let FileSystem: any;
if (Platform.OS !== "web") {
  ImagePicker = require("expo-image-picker");
  FileSystem = require("expo-file-system/legacy");
}
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useI18n } from "@/lib/i18n";
import { useSavedCollections } from "@/lib/saved-collections";

const { width } = Dimensions.get("window");

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "sw", name: "Swahili", flag: "🇹🇿" },
  { code: "yo", name: "Yoruba", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", flag: "🇳🇬" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "am", name: "Amharic", flag: "🇪🇹" },
  { code: "zu", name: "Zulu", flag: "🇿🇦" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "tl", name: "Tagalog", flag: "🇵🇭" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "el", name: "Greek", flag: "🇬🇷" },
  { code: "he", name: "Hebrew", flag: "🇮🇱" },
  { code: "fa", name: "Persian", flag: "🇮🇷" },
  { code: "ur", name: "Urdu", flag: "🇵🇰" },
  { code: "bn", name: "Bengali", flag: "🇧🇩" },
  { code: "pa", name: "Punjabi", flag: "🇮🇳" },
  { code: "ht", name: "Haitian Creole", flag: "🇭🇹" },
  { code: "pap", name: "Papiamento", flag: "🇨🇼" },
];

const SLANG_VARIANTS = [
  { id: "standard", label: "Standard", icon: "book-outline", free: true },
  { id: "dominican", label: "Dominican 🇩🇴", icon: "flame", free: true },
  { id: "venezuelan", label: "Venezuelan 🇻🇪", icon: "flame", free: true },
  { id: "colombian", label: "Colombian 🇨🇴", icon: "flame", free: true },
  { id: "puerto-rican", label: "Puerto Rican 🇵🇷", icon: "lock-closed", free: false },
  { id: "mexican", label: "Mexican 🇲🇽", icon: "lock-closed", free: false },
  { id: "cuban", label: "Cuban 🇨🇺", icon: "lock-closed", free: false },
  { id: "argentine", label: "Argentine 🇦🇷", icon: "lock-closed", free: false },
];

export default function TranslateScreen() {
  const { t } = useI18n();
  const { saveItem, unsaveItem, isItemSaved } = useSavedCollections();

  // ─── Core State ───
  const [inputText, setInputText] = useState("");
  const [fromLang, setFromLang] = useState(LANGUAGES[0]);
  const [toLang, setToLang] = useState(LANGUAGES[1]);
  const [selectedSlang, setSelectedSlang] = useState("standard");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("cgSgspJ2msm6clMCkdW9");
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [audioPlayerRef, setAudioPlayerRef] = useState<AudioPlayer | null>(null);
  const [cachedAudioUrls, setCachedAudioUrls] = useState<Record<string, string>>({});

  // ElevenLabs voice options
  const VOICE_OPTIONS = [
    { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Warm & Soothing" },
    { id: "SAz9YHcvj6GT2YYXdXww", name: "River", description: "Calm & Relaxed" },
    { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Deep & Comforting" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Velvety & Elegant" },
  ];

  // ─── Modals ───
  const [showHistory, setShowHistory] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState<"from" | "to" | null>(null);
  const [showSlangPicker, setShowSlangPicker] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [recentLangs, setRecentLangs] = useState<typeof LANGUAGES>([]);

  // ─── History & Bookmarks ───
  const [history, setHistory] = useState<any[]>([]);
  const HISTORY_KEY = "@translate_history";

  // ─── Auto-detect ───
  const [autoDetect, setAutoDetect] = useState(true);
  const [detectedInfo, setDetectedInfo] = useState<any>(null);

  // ─── Voice Input ───
  const { state: voiceState, startRecording, stopRecording, isAvailable: voiceAvailable } = useSpeechToText();
  const isRecording = voiceState === "recording";
  const isProcessingVoice = voiceState === "uploading" || voiceState === "transcribing";

  // ─── Handwriting Mode ───
  const [showHandwriting, setShowHandwriting] = useState(false);
  const [hwPaths, setHwPaths] = useState<string[]>([]);
  const [hwCurrentPath, setHwCurrentPath] = useState("");
  const [hwRecognizing, setHwRecognizing] = useState(false);
  const hwCanvasRef = useRef<View>(null);
  const hwCanvasWidth = useRef(width - 64);

  // ─── Breakdown / "Translations of..." Panel ───
  const [breakdownData, setBreakdownData] = useState<any>(null);
  const [showBreakdownPanel, setShowBreakdownPanel] = useState(false);

  // ─── Real-time debounce ───
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // ─── Camera/OCR Mode ───
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // ─── tRPC Mutations ───
  const translateMutation = trpc.translate.text.useMutation();
  const detectMutation = trpc.translate.detectLanguage.useMutation();
  const ttsMutation = trpc.translate.tts.useMutation();
  const recognizeHandwritingMutation = trpc.translate.recognizeHandwriting.useMutation();
  const varietyMutation = trpc.translate.variety.useMutation();
  const ocrMutation = trpc.translate.ocr.useMutation();

  // ─── Load Preferences ───
  useEffect(() => {
    AsyncStorage.getItem("@translate_from_lang").then((val) => {
      if (val) {
        const lang = LANGUAGES.find((l) => l.code === val);
        if (lang) setFromLang(lang);
      }
    });
    AsyncStorage.getItem("@translate_to_lang").then((val) => {
      if (val) {
        const lang = LANGUAGES.find((l) => l.code === val);
        if (lang) setToLang(lang);
      }
    });
    AsyncStorage.getItem("@translate_recent_langs").then((val) => {
      if (val) {
        try {
          const codes: string[] = JSON.parse(val);
          const langs = codes.map((c) => LANGUAGES.find((l) => l.code === c)).filter(Boolean) as typeof LANGUAGES;
          setRecentLangs(langs);
        } catch {}
      }
    });
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  };

  const saveToHistory = async (input: string, output: string, from: string, to: string, dialect?: string | null) => {
    const entry = {
      id: Date.now().toString(),
      input,
      output,
      from,
      to,
      dialect: dialect || null,
      timestamp: Date.now(),
      bookmarked: false,
    };
    const updated = [entry, ...history].slice(0, 100);
    setHistory(updated);
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  };

  const toggleBookmark = async (id: string) => {
    const updated = history.map((item) =>
      item.id === id ? { ...item, bookmarked: !item.bookmarked } : item
    );
    setHistory(updated);
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {}
    if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const clearHistory = async () => {
    setHistory([]);
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch {}
  };

  // ─── Swap Languages ───
  const handleSwapLanguages = () => {
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
    if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Re-translate if there's text
    if (inputText.trim() && translatedText) {
      // Swap input and output
      const prevInput = inputText;
      setInputText(translatedText);
      setTranslatedText(prevInput);
    }
  };

  // ─── Real-time Translation (as you type) ───
  const handleTextChange = (text: string) => {
    setInputText(text);

    if (text.trim().length === 0) {
      setTranslatedText("");
      setDetectedInfo(null);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    if (text.trim().length >= 1) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          setIsTranslating(true);
          let detectedFromLang = fromLang.name;

          // Auto-detect
          if (autoDetect && text.trim().length >= 3) {
            try {
              const detectResult = await detectMutation.mutateAsync({ text: text.trim() });
              if (detectResult.success && detectResult.language !== "Unknown") {
                detectedFromLang = detectResult.language;
                setDetectedInfo({
                  language: detectResult.language,
                  dialect: detectResult.dialect,
                  slangType: detectResult.slangType,
                  confidence: detectResult.confidence,
                });
                const matchedLang = LANGUAGES.find((l) => l.name.toLowerCase() === detectResult.language.toLowerCase());
                if (matchedLang) setFromLang(matchedLang);
                if (detectResult.dialect) {
                  const matchedSlang = SLANG_VARIANTS.find((s) => s.label.toLowerCase().includes(detectResult.dialect!.toLowerCase()));
                  if (matchedSlang) setSelectedSlang(matchedSlang.id);
                }
              }
            } catch {}
          }

          const result = await translateMutation.mutateAsync({
            text: text.trim(),
            fromLanguage: autoDetect ? detectedFromLang : fromLang.name,
            toLanguage: toLang.name,
            dialect: selectedSlang !== "standard" ? selectedSlang : undefined,
            style: selectedSlang === "standard" ? "standard" : "slang",
            includeBreakdown: true,
          });

          if (result.success) {
            setTranslatedText(result.translation);
            // Store breakdown data for "Translations of..." panel
            if (result.breakdown) setBreakdownData(result.breakdown);
            else setBreakdownData(null);
            // Save to history
            saveToHistory(text.trim(), result.translation, fromLang.name, toLang.name, result.dialect);
          }
        } catch {} finally {
          setIsTranslating(false);
        }
      }, 600);
    }
  };

  // ─── Voice Input ───
  const handleVoiceInput = async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text) {
        setInputText(text);
        handleTextChange(text);
        if ((Platform.OS as string) !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      await startRecording();
      if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // ─── Copy ───
  const handleCopy = async () => {
    if (!translatedText) return;
    await Clipboard.setStringAsync(translatedText);
    setCopied(true);
    if ((Platform.OS as string) !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Share ───
  const handleShare = async () => {
    if (!translatedText) return;
    let shareText = `${inputText}\n→ ${translatedText}`;
    if (detectedInfo?.dialect) shareText += `\n🗺️ ${detectedInfo.dialect}`;
    shareText += `\n\nTranslated with ConnectWorld AI`;
    try {
      await Share.share({ message: shareText });
    } catch {}
  };

  // ─── Listen (TTS) ───
  const handleListen = async () => {
    if (!translatedText) return;

    if (isSpeaking && audioPlayerRef) {
      audioPlayerRef.pause();
      audioPlayerRef.remove();
      setAudioPlayerRef(null);
      setIsSpeaking(false);
      return;
    }

    if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await setAudioModeAsync({ playsInSilentMode: true });
    } catch {}

    const speakFallback = () => {
      try {
        Speech.speak(translatedText, {
          language: toLang.code,
          rate: 0.9,
          onDone: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      } catch {
        setIsSpeaking(false);
      }
    };

    const playAudioUrl = (url: string) => {
      try {
        const player = createAudioPlayer(url);
        setAudioPlayerRef(player);
        player.play();
        const checkInterval = setInterval(() => {
          try {
            if (!player.playing) {
              setIsSpeaking(false);
              player.remove();
              setAudioPlayerRef(null);
              clearInterval(checkInterval);
            }
          } catch {
            setIsSpeaking(false);
            clearInterval(checkInterval);
          }
        }, 500);
        setTimeout(() => {
          clearInterval(checkInterval);
          try { player.pause(); player.remove(); } catch {}
          setIsSpeaking(false);
          setAudioPlayerRef(null);
        }, 60000);
      } catch {
        speakFallback();
      }
    };

    const cacheKey = `${translatedText}_${selectedVoice}`;
    const cachedUrl = cachedAudioUrls[cacheKey];
    if (cachedUrl) {
      setIsSpeaking(true);
      playAudioUrl(cachedUrl);
      return;
    }

    setIsLoadingAudio(true);
    setIsSpeaking(true);
    try {
      const result = await ttsMutation.mutateAsync({
        text: translatedText,
        voiceId: selectedVoice,
        language: toLang.code,
      });
      if (result.audioUrl) {
        setCachedAudioUrls((prev) => ({ ...prev, [cacheKey]: result.audioUrl }));
        playAudioUrl(result.audioUrl);
      } else {
        speakFallback();
      }
    } catch {
      // fallback to expo-speech if ElevenLabs fails
      speakFallback();
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // ─── Handwriting Recognition ───
  const handleRecognizeHandwriting = async () => {
    if (hwPaths.length === 0 || hwRecognizing) return;
    setHwRecognizing(true);
    if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      // Try to capture canvas as base64 image first
      let base64Image: string | undefined;
      try {
        if (hwCanvasRef.current) {
          const uri = await captureRef(hwCanvasRef.current, { format: "png", result: "base64", quality: 0.8 });
          if (uri && uri.length > 100) base64Image = uri;
        }
      } catch {}

      const result = await recognizeHandwritingMutation.mutateAsync({
        paths: hwPaths,
        canvasWidth: hwCanvasWidth.current,
        canvasHeight: 220,
        targetLanguage: fromLang.name,
        ...(base64Image ? { base64Image, mimeType: "image/png" as const } : {}),
      });

      if (result.text) {
        const recognized = result.text.replace(/^"|"$/g, "");
        const newText = inputText ? `${inputText} ${recognized}` : recognized;
        setInputText(newText);
        handleTextChange(newText);
        // Clear canvas after successful recognition
        setHwPaths([]);
        setHwCurrentPath("");
        if ((Platform.OS as string) !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {} finally {
      setHwRecognizing(false);
    }
  };

  // ─── Clear ───
  const handleClear = () => {
    setInputText("");
    setTranslatedText("");
    setDetectedInfo(null);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    inputRef.current?.focus();
  };

  // ─── Camera/OCR Input ───
  const handleCameraOcr = async () => {
    if (Platform.OS === "web" || !ImagePicker) return;
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      let result;
      if (status === "granted") {
        result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          base64: true,
          allowsEditing: false,
        });
      } else {
        // Fall back to photo library
        const libStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libStatus.status !== "granted") return;
        result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          base64: true,
          allowsEditing: false,
        });
      }

      if (result.canceled || !result.assets?.[0]?.base64) return;

      setIsOcrProcessing(true);
      if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const asset = result.assets[0];
      const mimeType = asset.mimeType || "image/jpeg";

      // Send to OCR endpoint
      const ocrResult = await ocrMutation.mutateAsync({
        base64Image: asset.base64!,
        mimeType,
      });

      if (ocrResult.success && ocrResult.text) {
        const extracted = ocrResult.text.trim();
        setInputText(extracted);
        handleTextChange(extracted);
        if ((Platform.OS as string) !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.warn("[OCR] Camera capture failed:", err);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // ─── Paste ───
  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setInputText(text);
      handleTextChange(text);
    }
  };

  // ─── History Item Press ───
  const handleHistoryItemPress = (item: any) => {
    setInputText(item.input);
    setTranslatedText(item.output);
    const from = LANGUAGES.find((l) => l.name === item.from);
    const to = LANGUAGES.find((l) => l.name === item.to);
    if (from) setFromLang(from);
    if (to) setToLang(to);
    setShowHistory(false);
  };

  // ─── Group history by date ───
  const getHistoryGroups = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { title: string; data: any[] }[] = [];
    const todayItems: any[] = [];
    const yesterdayItems: any[] = [];
    const olderItems: any[] = [];

    history.forEach((item) => {
      const itemDate = new Date(item.timestamp);
      itemDate.setHours(0, 0, 0, 0);
      if (itemDate.getTime() === today.getTime()) todayItems.push(item);
      else if (itemDate.getTime() === yesterday.getTime()) yesterdayItems.push(item);
      else olderItems.push(item);
    });

    if (todayItems.length > 0) groups.push({ title: "Today", data: todayItems });
    if (yesterdayItems.length > 0) groups.push({ title: "Yesterday", data: yesterdayItems });
    if (olderItems.length > 0) groups.push({ title: "Earlier", data: olderItems });

    return groups;
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER — Google Translate-style clean layout
  // ═══════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
            <Text style={styles.headerBackText}>Home</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            {selectedSlang !== "standard" && (
              <View style={styles.dialectBadgeSmall}>
                <Text style={styles.dialectBadgeSmallText}>
                  {SLANG_VARIANTS.find((s) => s.id === selectedSlang)?.label || ""}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => setShowSlangPicker(true)}>
              <Ionicons name="flame-outline" size={20} color={Colors.secondary} />
            </TouchableOpacity>
            {inputText.length > 0 && (
              <TouchableOpacity style={styles.headerIconBtn} onPress={handleClear}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => setShowMoreActions(true)}>
              <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Main Content Area ─── */}
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={styles.mainContentInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Input Text — Large, clean, no borders */}
          <TextInput
            ref={inputRef}
            style={styles.inputText}
            placeholder="Enter text"
            placeholderTextColor={Colors.textMuted}
            multiline
            value={inputText}
            onChangeText={handleTextChange}
            textAlignVertical="top"
            autoFocus={false}
          />

          {/* Paste button when empty */}
          {inputText.length === 0 && (
            <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste}>
              <Ionicons name="clipboard-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.pasteBtnText}>Paste</Text>
            </TouchableOpacity>
          )}

          {/* ─── Blue Divider + Translation Output ─── */}
          {(translatedText || isTranslating) && (
            <View style={styles.outputSection}>
              <View style={styles.blueDivider} />

              {isTranslating && !translatedText ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={Colors.secondary} />
                </View>
              ) : (
                <>
                  <Text style={styles.outputText}>{translatedText}</Text>

                  {/* Action Icons Row */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleListen}>
                      {isLoadingAudio ? (
                        <><ActivityIndicator size="small" color={Colors.secondary} /><Text style={{ fontSize: 9, color: Colors.textMuted }}>Loading...</Text></>
                      ) : (
                        <Ionicons
                          name={isSpeaking ? "stop-circle" : "volume-high"}
                          size={20}
                          color={isSpeaking ? Colors.error : Colors.secondary}
                        />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowVoicePicker(true)}>
                      <Ionicons name="mic-outline" size={18} color={Colors.secondary} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                      <Ionicons
                        name={copied ? "checkmark" : "copy-outline"}
                        size={20}
                        color={copied ? Colors.success : Colors.secondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                      <Ionicons name="share-outline" size={20} color={Colors.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowMoreActions(true)}>
                      <Ionicons name="ellipsis-horizontal" size={20} color={Colors.secondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Detected dialect info */}
                  {detectedInfo?.dialect && (
                    <View style={styles.detectedRow}>
                      <Ionicons name="location" size={14} color={Colors.secondary} />
                      <Text style={styles.detectedText}>
                        {detectedInfo.dialect}
                        {detectedInfo.slangType ? ` • ${detectedInfo.slangType}` : ""}
                      </Text>
                    </View>
                  )}

                  {/* "Translations of..." deep panel trigger */}
                  {breakdownData && (
                    <TouchableOpacity
                      style={styles.translationsOfCard}
                      onPress={() => setShowBreakdownPanel(true)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.translationsOfHeader}>
                        <Text style={styles.translationsOfTitle}>Translations of <Text style={{ fontWeight: "700" }}>{inputText.split(" ").slice(0, 3).join(" ")}</Text></Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                      </View>
                      {breakdownData.breakdown?.slice(0, 2).map((item: any, idx: number) => (
                        <View key={idx} style={styles.translationsOfRow}>
                          <Ionicons name="search" size={14} color={Colors.textMuted} />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.translationsOfPhrase}>{item.original}</Text>
                            <Text style={styles.translationsOfMeaning}>{item.meaning}</Text>
                          </View>
                          <Ionicons name="arrow-up-outline" size={16} color={Colors.textMuted} style={{ transform: [{ rotate: "45deg" }] }} />
                        </View>
                      ))}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
        </ScrollView>

        {/* ─── Bottom Bar: Language Selector + Mic ─── */}
        <View style={styles.bottomBar}>
          <View style={styles.langSelector}>
            <TouchableOpacity
              style={styles.langButton}
              onPress={() => { setLangSearch(""); setShowLangPicker("from"); }}
            >
              <Text style={styles.langButtonText}>{fromLang.name}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.swapBtn} onPress={handleSwapLanguages}>
              <Ionicons name="swap-horizontal" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.langButton}
              onPress={() => { setLangSearch(""); setShowLangPicker("to"); }}
            >
              <Text style={styles.langButtonText}>{toLang.name}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick action row */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionBtn, isRecording && styles.quickActionBtnActive]}
              onPress={handleVoiceInput}
              disabled={isProcessingVoice}
            >
              {isProcessingVoice ? (
                <ActivityIndicator size="small" color={Colors.secondary} />
              ) : (
                <Ionicons
                  name={isRecording ? "stop" : "mic"}
                  size={20}
                  color={isRecording ? "#EF4444" : Colors.textSecondary}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionBtn, isOcrProcessing && styles.quickActionBtnActive]}
              onPress={handleCameraOcr}
              disabled={isOcrProcessing}
            >
              {isOcrProcessing ? (
                <ActivityIndicator size="small" color={Colors.secondary} />
              ) : (
                <Ionicons name="camera-outline" size={20} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowHandwriting(true)}>
              <Ionicons name="pencil-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowHistory(true)}>
              <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push("/saved-collections" as any)}>
              <Ionicons name="bookmark-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ═══════════════ HISTORY MODAL ═══════════════ */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView style={styles.historyModal}>
          <View style={styles.historyHeader}>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.historyTitle}>History</Text>
            <TouchableOpacity onPress={() => setShowMoreActions(true)}>
              <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {history.length === 0 ? (
            <View style={styles.historyEmpty}>
              <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.historyEmptyTitle}>No translations yet</Text>
              <Text style={styles.historyEmptySubtitle}>Your recent translations will appear here</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              {getHistoryGroups().map((group) => (
                <View key={group.title}>
                  <Text style={styles.historyGroupTitle}>{group.title}</Text>
                  <View style={styles.historyGroupDivider} />
                  {group.data.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.historyItem}
                      onPress={() => handleHistoryItemPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.historyItemContent}>
                        <Text style={styles.historyItemInput} numberOfLines={2}>{item.input}</Text>
                        <Text style={styles.historyItemOutput} numberOfLines={2}>{item.output}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.historyBookmarkBtn}
                        onPress={() => toggleBookmark(item.id)}
                      >
                        <Ionicons
                          name={item.bookmarked ? "bookmark" : "bookmark-outline"}
                          size={20}
                          color={item.bookmarked ? Colors.secondary : Colors.textMuted}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ═══════════════ LANGUAGE PICKER MODAL ═══════════════ */}
      <Modal
        visible={showLangPicker !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLangPicker(null)}
      >
        <SafeAreaView style={styles.langPickerModal}>
          <View style={styles.langPickerHeader}>
            <Text style={styles.langPickerTitle}>
              {showLangPicker === "from" ? "Translate from" : "Translate to"}
            </Text>
            <TouchableOpacity onPress={() => setShowLangPicker(null)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.langSearchBar}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.langSearchInput}
              placeholder="Search languages..."
              placeholderTextColor={Colors.textMuted}
              value={langSearch}
              onChangeText={setLangSearch}
              autoFocus
            />
            {langSearch.length > 0 && (
              <TouchableOpacity onPress={() => setLangSearch("")}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={LANGUAGES.filter(
              (l) =>
                l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
                l.code.toLowerCase().includes(langSearch.toLowerCase())
            )}
            keyExtractor={(item) => item.code}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListHeaderComponent={
              recentLangs.length > 0 && !langSearch ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.langSectionTitle}>Recent</Text>
                  {recentLangs.map((lang) => {
                    const isSelected = showLangPicker === "from" ? fromLang.code === lang.code : toLang.code === lang.code;
                    return (
                      <TouchableOpacity
                        key={`recent-${lang.code}`}
                        style={[styles.langItem, isSelected && styles.langItemSelected]}
                        onPress={() => {
                          if (showLangPicker === "from") {
                            setFromLang(lang);
                            AsyncStorage.setItem("@translate_from_lang", lang.code);
                          } else {
                            setToLang(lang);
                            AsyncStorage.setItem("@translate_to_lang", lang.code);
                          }
                          setShowLangPicker(null);
                          if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Text style={styles.langItemFlag}>{lang.flag}</Text>
                        <Text style={[styles.langItemName, isSelected && styles.langItemNameSelected]}>{lang.name}</Text>
                        {isSelected && <Ionicons name="checkmark" size={20} color={Colors.secondary} />}
                      </TouchableOpacity>
                    );
                  })}
                  <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 12 }} />
                  <Text style={styles.langSectionTitle}>All Languages</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const isSelected = showLangPicker === "from" ? fromLang.code === item.code : toLang.code === item.code;
              return (
                <TouchableOpacity
                  style={[styles.langItem, isSelected && styles.langItemSelected]}
                  onPress={() => {
                    if (showLangPicker === "from") {
                      setFromLang(item);
                      AsyncStorage.setItem("@translate_from_lang", item.code);
                    } else {
                      setToLang(item);
                      AsyncStorage.setItem("@translate_to_lang", item.code);
                    }
                    const updatedRecent = [item, ...recentLangs.filter((l) => l.code !== item.code)].slice(0, 5);
                    setRecentLangs(updatedRecent);
                    AsyncStorage.setItem("@translate_recent_langs", JSON.stringify(updatedRecent.map((l) => l.code)));
                    setShowLangPicker(null);
                    if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.langItemFlag}>{item.flag}</Text>
                  <Text style={[styles.langItemName, isSelected && styles.langItemNameSelected]}>{item.name}</Text>
                  {isSelected && <Ionicons name="checkmark" size={20} color={Colors.secondary} />}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* ═══════════════ SLANG PICKER MODAL ═══════════════ */}
      <Modal
        visible={showSlangPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSlangPicker(false)}
      >
        <SafeAreaView style={styles.langPickerModal}>
          <View style={styles.langPickerHeader}>
            <Text style={styles.langPickerTitle}>Dialect / Slang Style</Text>
            <TouchableOpacity onPress={() => setShowSlangPicker(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.slangPickerSubtitle}>
            Choose how the translation sounds — standard textbook or real street talk
          </Text>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            {SLANG_VARIANTS.map((variant) => (
              <TouchableOpacity
                key={variant.id}
                style={[styles.slangItem, selectedSlang === variant.id && styles.slangItemActive]}
                onPress={() => {
                  if (variant.free) {
                    setSelectedSlang(variant.id);
                    setShowSlangPicker(false);
                    // Re-translate with new dialect
                    if (inputText.trim()) {
                      handleTextChange(inputText);
                    }
                    if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                disabled={!variant.free}
              >
                <View style={styles.slangItemLeft}>
                  <Ionicons
                    name={variant.icon as any}
                    size={18}
                    color={selectedSlang === variant.id ? Colors.secondary : Colors.textSecondary}
                  />
                  <Text style={[styles.slangItemText, selectedSlang === variant.id && styles.slangItemTextActive]}>
                    {variant.label}
                  </Text>
                </View>
                {variant.free ? (
                  selectedSlang === variant.id ? (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
                  ) : null
                ) : (
                  <View style={styles.proTag}>
                    <Ionicons name="lock-closed" size={12} color={Colors.gold} />
                    <Text style={styles.proTagText}>PRO</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ═══════════════ MORE ACTIONS MODAL ═══════════════ */}
      <Modal
        visible={showMoreActions}
        animationType="fade"
        transparent
        onRequestClose={() => setShowMoreActions(false)}
      >
        <TouchableOpacity
          style={styles.moreActionsOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreActions(false)}
        >
          <View style={styles.moreActionsSheet}>
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); handleCameraOcr(); }}>
              <Ionicons name="camera-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.moreActionText}>Camera Translate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); router.push("/live-ar-camera" as any); }}>
              <Ionicons name="scan-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.moreActionText}>Live AR Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); router.push("/voice-to-voice-translate" as any); }}>
              <Ionicons name="chatbubbles-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.moreActionText}>Voice-to-Voice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); router.push("/cloudwave-translator-setup" as any); }}>
              <Ionicons name="apps-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.moreActionText}>System-Wide Translator</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); router.push("/call-translator" as any); }}>
              <Ionicons name="call-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.moreActionText}>Live Call Translation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); router.push("/voice-clone-translation" as any); }}>
              <Ionicons name="mic-circle-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.moreActionText}>Voice Clone Translation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); router.push("/dominican-slang-dictionary" as any); }}>
              <Ionicons name="book-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.moreActionText}>Slang Dictionary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); router.push("/video-translate" as any); }}>
              <Ionicons name="film-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.moreActionText}>Video Dubbing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); router.push("/auto-language-detect" as any); }}>
              <Ionicons name="globe-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.moreActionText}>Auto Language Detect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); router.push("/video-call-captions" as any); }}>
              <Ionicons name="videocam-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.moreActionText}>Video Call Captions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); router.push("/screen-overlay-translate" as any); }}>
              <Ionicons name="layers-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.moreActionText}>Screen Overlay Translate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); router.push("/offline-translation-packs" as any); }}>
              <Ionicons name="cloud-download-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.moreActionText}>Offline Packs</Text>
            </TouchableOpacity>
            <View style={styles.moreActionDivider} />
            <TouchableOpacity style={styles.moreActionItem} onPress={() => { setShowMoreActions(false); clearHistory(); }}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={[styles.moreActionText, { color: Colors.error }]}>Clear History</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
            </Modal>

      {/* ═══════════════ VOICE PICKER MODAL ═══════════════ */}
      <Modal
        visible={showVoicePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVoicePicker(false)}
      >
        <TouchableOpacity
          style={styles.moreActionsOverlay}
          activeOpacity={1}
          onPress={() => setShowVoicePicker(false)}
        >
          <View style={styles.moreActionsSheet}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 }}>Select Voice</Text>
            {VOICE_OPTIONS.map((voice) => (
              <TouchableOpacity
                key={voice.id}
                style={[styles.moreActionItem, selectedVoice === voice.id && { backgroundColor: Colors.surfaceElevated }]}
                onPress={() => { setSelectedVoice(voice.id); setShowVoicePicker(false); }}
              >
                <Ionicons name={selectedVoice === voice.id ? "radio-button-on" : "radio-button-off"} size={20} color={Colors.secondary} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.moreActionText}>{voice.name}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted }}>{voice.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ═══════════════ HANDWRITING MODAL ═══════════════ */}
      <Modal
        visible={showHandwriting}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHandwriting(false)}
      >
        <SafeAreaView style={styles.handwritingModal}>
          <View style={styles.handwritingHeader}>
            <TouchableOpacity onPress={() => setShowHandwriting(false)}>
              <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.handwritingTitle}>Write</Text>
            <TouchableOpacity onPress={() => {
              setShowHandwriting(false);
              inputRef.current?.focus();
            }}>
              <Ionicons name="keypad-outline" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Input area showing recognized text */}
          <View style={styles.hwInputArea}>
            <TextInput
              style={styles.hwInputText}
              placeholder="Enter text"
              placeholderTextColor={Colors.textMuted}
              multiline
              value={inputText}
              onChangeText={handleTextChange}
            />
            {translatedText ? (
              <Text style={styles.hwTranslatedText}>{translatedText}</Text>
            ) : null}
          </View>

          {/* Drawing Canvas */}
          <View style={styles.hwCanvasContainer}>
            <View style={styles.hwCanvasDragHandle}>
              <View style={styles.hwDragBar} />
            </View>
            <View ref={hwCanvasRef} style={styles.hwCanvas} collapsable={false}>
              <GestureDetector gesture={
                Gesture.Pan()
                  .runOnJS(true)
                  .onBegin((e) => {
                    setHwCurrentPath(`M${e.x},${e.y}`);
                  })
                  .onUpdate((e) => {
                    setHwCurrentPath((prev) => `${prev} L${e.x},${e.y}`);
                  })
                  .onEnd(() => {
                    if (hwCurrentPath) {
                      setHwPaths((prev) => [...prev, hwCurrentPath]);
                      setHwCurrentPath("");
                      // Auto-recognize after 1.5s of no drawing
                      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                      debounceTimerRef.current = setTimeout(() => handleRecognizeHandwriting(), 1500);
                    }
                  })
              }>
                <View style={styles.hwSvgContainer}>
                  <Svg width="100%" height="100%" style={{ position: "absolute" }}>
                    {hwPaths.map((d, i) => (
                      <Path key={i} d={d} stroke={Colors.textPrimary} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    ))}
                    {hwCurrentPath ? (
                      <Path d={hwCurrentPath} stroke={Colors.secondary} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    ) : null}
                  </Svg>
                  {hwPaths.length === 0 && !hwCurrentPath && (
                    <Text style={styles.hwPlaceholder}>Write here</Text>
                  )}
                </View>
              </GestureDetector>
            </View>

            {/* Canvas Controls */}
            <View style={styles.hwControls}>
              <TouchableOpacity style={styles.hwControlBtn} onPress={() => {
                // Undo last stroke
                setHwPaths((prev) => prev.slice(0, -1));
              }}>
                <Ionicons name="arrow-undo" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.hwControlBtn} onPress={() => {
                setHwPaths([]);
                setHwCurrentPath("");
              }}>
                <Ionicons name="backspace-outline" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.hwControlBtn, styles.hwSubmitBtn]}
                onPress={handleRecognizeHandwriting}
                disabled={hwPaths.length === 0 || hwRecognizing}
              >
                {hwRecognizing ? (
                  <ActivityIndicator size="small" color={Colors.secondary} />
                ) : (
                  <Ionicons name="arrow-forward" size={20} color={hwPaths.length > 0 ? Colors.secondary : Colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ═══════════════ TRANSLATIONS OF... BREAKDOWN PANEL ═══════════════ */}
      <Modal
        visible={showBreakdownPanel}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBreakdownPanel(false)}
      >
        <SafeAreaView style={styles.breakdownModal}>
          <View style={styles.breakdownHeader}>
            <TouchableOpacity onPress={() => setShowBreakdownPanel(false)}>
              <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.breakdownTitle}>Translations of <Text style={{ fontWeight: "700" }}>{inputText}</Text></Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
            {/* Word-by-word breakdown */}
            {breakdownData?.breakdown && breakdownData.breakdown.length > 0 && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownSectionTitle}>Word Breakdown</Text>
                {breakdownData.breakdown.map((item: any, idx: number) => (
                  <View key={idx} style={styles.breakdownWordCard}>
                    <View style={styles.breakdownWordRow}>
                      <Text style={styles.breakdownOriginal}>{item.original}</Text>
                      <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
                      <Text style={styles.breakdownMeaning}>{item.meaning}</Text>
                    </View>
                    {item.note && <Text style={styles.breakdownNote}>{item.note}</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* Perspectives / Conjugation */}
            {breakdownData?.perspectives && breakdownData.perspectives.length > 0 && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownSectionTitle}>Conjugation</Text>
                {breakdownData.perspectiveNote && (
                  <Text style={styles.breakdownPerspNote}>{breakdownData.perspectiveNote}</Text>
                )}
                {breakdownData.perspectives.map((p: any, idx: number) => (
                  <View key={idx} style={styles.perspectiveRow}>
                    <Text style={styles.perspPerson}>{p.person}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.perspTarget}>{p.target}</Text>
                      {p.pronunciation && <Text style={styles.perspPronunciation}>{p.pronunciation}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Multiple Meanings */}
            {breakdownData?.multipleMeanings && breakdownData.multipleMeanings.length > 0 && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownSectionTitle}>Multiple Meanings</Text>
                {breakdownData.multipleMeanings.map((mm: any, idx: number) => (
                  <View key={idx} style={styles.multipleMeaningCard}>
                    <Text style={styles.mmWord}>{mm.word}</Text>
                    {mm.meanings?.map((m: any, mIdx: number) => (
                      <View key={mIdx} style={styles.mmMeaningRow}>
                        <Text style={styles.mmMeaning}>{m.meaning}</Text>
                        <Text style={styles.mmRegion}>{m.region}</Text>
                        {m.warning && <Text style={styles.mmWarning}>{m.warning}</Text>}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Cultural Note */}
            {breakdownData?.culturalNote && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownSectionTitle}>Cultural Context</Text>
                <View style={styles.culturalNoteCard}>
                  <Ionicons name="information-circle" size={18} color={Colors.secondary} />
                  <Text style={styles.culturalNoteText}>{breakdownData.culturalNote}</Text>
                </View>
              </View>
            )}

            {/* Formality + Region */}
            {(breakdownData?.formality || breakdownData?.region) && (
              <View style={styles.breakdownMetaRow}>
                {breakdownData.formality && (
                  <View style={styles.metaTag}>
                    <Text style={styles.metaTagText}>{breakdownData.formality}</Text>
                  </View>
                )}
                {breakdownData.region && (
                  <View style={styles.metaTag}>
                    <Ionicons name="location" size={12} color={Colors.secondary} />
                    <Text style={styles.metaTagText}>{breakdownData.region}</Text>
                  </View>
                )}
                {breakdownData.slangType && breakdownData.slangType !== "Standard" && (
                  <View style={[styles.metaTag, { borderColor: Colors.gold }]}>
                    <Text style={[styles.metaTagText, { color: Colors.gold }]}>{breakdownData.slangType}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Source Citations */}
            {breakdownData?.sourceCitations && breakdownData.sourceCitations.length > 0 && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownSectionTitle}>Sources</Text>
                {breakdownData.sourceCitations.map((src: string, idx: number) => (
                  <Text key={idx} style={styles.sourceText}>{src}</Text>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  // ─── Header ───
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerBackText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dialectBadgeSmall: {
    backgroundColor: "rgba(0, 212, 255, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.3)",
  },
  dialectBadgeSmallText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.secondary,
  },

  // ─── Main Content ───
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainContentInner: {
    flexGrow: 1,
    paddingTop: 8,
  },
  inputText: {
    fontSize: 28,
    fontWeight: "400",
    color: Colors.textPrimary,
    minHeight: 80,
    lineHeight: 38,
    paddingVertical: 0,
  },
  pasteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 24,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pasteBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  // ─── Output Section ───
  outputSection: {
    marginTop: 16,
  },
  blueDivider: {
    height: 2,
    backgroundColor: Colors.secondary,
    marginBottom: 16,
    borderRadius: 1,
  },
  loadingRow: {
    paddingVertical: 8,
  },
  outputText: {
    fontSize: 26,
    fontWeight: "400",
    color: Colors.secondary,
    lineHeight: 36,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 20,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  detectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0, 212, 255, 0.08)",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  detectedText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: "500",
  },

  // ─── Bottom Bar ───
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.primary,
  },
  langSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  langButton: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 10,
  },
  quickActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionBtnActive: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },

  // ─── History Modal ───
  historyModal: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  historyEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  historyEmptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 16,
  },
  historyEmptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 6,
  },
  historyGroupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.secondary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  historyGroupDivider: {
    height: 2,
    backgroundColor: Colors.secondary,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 1,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemInput: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  historyItemOutput: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  historyBookmarkBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // ─── Language Picker Modal ───
  langPickerModal: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  langPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  langPickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  langSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  langSearchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  langSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
    gap: 12,
  },
  langItemSelected: {
    backgroundColor: `${Colors.secondary}15`,
  },
  langItemFlag: {
    fontSize: 24,
  },
  langItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
    flex: 1,
  },
  langItemNameSelected: {
    fontWeight: "700",
    color: Colors.secondary,
  },

  // ─── Slang Picker ───
  slangPickerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  slangItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slangItemActive: {
    borderColor: Colors.secondary,
    backgroundColor: `${Colors.secondary}10`,
  },
  slangItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  slangItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  slangItemTextActive: {
    color: Colors.secondary,
    fontWeight: "700",
  },
  proTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 184, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.gold,
  },

  // ─── More Actions Sheet ───
  moreActionsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  moreActionsSheet: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  moreActionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  moreActionText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  moreActionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  // ─── Handwriting Modal ───
  handwritingModal: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  handwritingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  handwritingTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  hwInputArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  hwInputText: {
    fontSize: 28,
    fontWeight: "400",
    color: Colors.textPrimary,
    minHeight: 60,
  },
  hwTranslatedText: {
    fontSize: 22,
    color: Colors.secondary,
    marginTop: 8,
  },
  hwCanvasContainer: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 16,
  },
  hwCanvasDragHandle: {
    alignItems: "center",
    paddingVertical: 8,
  },
  hwDragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  hwCanvas: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    overflow: "hidden",
  },
  hwSvgContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hwPlaceholder: {
    fontSize: 24,
    color: Colors.textMuted,
    fontWeight: "300",
  },
  hwControls: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  hwControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  hwSubmitBtn: {
    backgroundColor: "rgba(0, 170, 255, 0.15)",
  },
  // ─── Translations Of... Card ───
  translationsOfCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 12,
    padding: 14,
  },
  translationsOfHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  translationsOfTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  translationsOfRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  translationsOfPhrase: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  translationsOfMeaning: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // ─── Breakdown Modal ───
  breakdownModal: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },
  breakdownSection: {
    marginTop: 24,
  },
  breakdownSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  breakdownWordCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  breakdownWordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  breakdownOriginal: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  breakdownMeaning: {
    fontSize: 15,
    color: Colors.secondary,
    fontWeight: "500",
  },
  breakdownNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: "italic",
  },
  breakdownPerspNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontStyle: "italic",
  },
  perspectiveRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  perspPerson: {
    fontSize: 13,
    color: Colors.textMuted,
    width: 90,
  },
  perspTarget: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  perspPronunciation: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  multipleMeaningCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  mmWord: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  mmMeaningRow: {
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  mmMeaning: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  mmRegion: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
  },
  mmWarning: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 2,
  },
  culturalNoteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    borderRadius: 10,
    padding: 12,
  },
  culturalNoteText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  breakdownMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
  },
  metaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaTagText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  sourceText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
});
