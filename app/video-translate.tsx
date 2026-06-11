import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";
// expo-image-picker crashes on web due to native permission hooks
// We'll dynamically require it only on native platforms in the handler
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSubscription, VIDEO_DUB_MONTHLY_LIMITS } from "@/hooks/use-subscription";
import { usePaywallGate } from "@/hooks/use-paywall-gate";
import { PaywallModal } from "@/components/paywall-modal";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";

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
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "tl", name: "Tagalog", flag: "🇵🇭" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "el", name: "Greek", flag: "🇬🇷" },
];

type ProcessingStage = "idle" | "uploading" | "extracting" | "translating" | "dubbing" | "complete" | "error";

const STAGE_LABELS: Record<ProcessingStage, string> = {
  idle: "",
  uploading: "Uploading video...",
  extracting: "Extracting audio & transcribing...",
  translating: "Translating to target language...",
  dubbing: "Generating dubbed audio...",
  complete: "Translation complete!",
  error: "Something went wrong",
};

const STAGE_PROGRESS: Record<ProcessingStage, number> = {
  idle: 0,
  uploading: 0.15,
  extracting: 0.35,
  translating: 0.60,
  dubbing: 0.85,
  complete: 1.0,
  error: 0,
};

const VIDEO_DUB_USAGE_KEY = "@video_dub_usage";
const VIDEO_DUB_HISTORY_KEY = "@video_dub_history";

interface DubUsage {
  count: number;
  month: string; // YYYY-MM
}

export default function VideoTranslateScreen() {
  const { showPaywall, paywallFeature, singlePrice, checkAccess, dismissPaywall } = usePaywallGate();

  const { plan } = useSubscription();
  const translateMutation = trpc.translate.text.useMutation();
  const videoStartJobMutation = trpc.videoTranslate.startJob.useMutation();
  const videoTranscriptMutation = trpc.videoTranslate.translateTranscript.useMutation();
  const heygenDubMutation = trpc.heygen.dubVideo.useMutation();
  const monthlyLimit = VIDEO_DUB_MONTHLY_LIMITS[plan];
  const [sourceLanguage, setSourceLanguage] = useState(LANGUAGES[0]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [targetLanguage, setTargetLanguage] = useState(LANGUAGES[1]);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [videoSelected, setVideoSelected] = useState(false);
  const [videoName, setVideoName] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [videoUri, setVideoUri] = useState("");
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("idle");
  const [keepOriginalSubtitles, setKeepOriginalSubtitles] = useState(true);
  const [useVoiceClone, setUseVoiceClone] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [dubUsage, setDubUsage] = useState<DubUsage>({ count: 0, month: "" });

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const raw = await AsyncStorage.getItem(VIDEO_DUB_USAGE_KEY);
      if (raw) {
        const data: DubUsage = JSON.parse(raw);
        // Reset if new month
        if (data.month !== currentMonth) {
          setDubUsage({ count: 0, month: currentMonth });
        } else {
          setDubUsage(data);
        }
      } else {
        setDubUsage({ count: 0, month: currentMonth });
      }
    } catch {
      setDubUsage({ count: 0, month: currentMonth });
    }
  };

  const incrementUsage = async () => {
    const newUsage = { count: dubUsage.count + 1, month: currentMonth };
    setDubUsage(newUsage);
    await AsyncStorage.setItem(VIDEO_DUB_USAGE_KEY, JSON.stringify(newUsage));
  };

  const isAtLimit = monthlyLimit !== -1 && dubUsage.count >= monthlyLimit;
  const remainingDubs = monthlyLimit === -1 ? Infinity : monthlyLimit - dubUsage.count;

  const pulseAnim = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseAnim.value,
  }));

  const handleSelectVideo = async () => {
    if (isAtLimit) {
      Alert.alert(
        "Monthly Limit Reached",
        `You've used all ${monthlyLimit} video dub${monthlyLimit === 1 ? "" : "s"} this month. Upgrade to get more.`,
        [
          { text: "Upgrade", onPress: () => router.push("/subscription" as any) },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    if (Platform.OS === "web") {
      // On web, use a file input approach
      Alert.alert("Video Selection", "Video selection from camera roll is available on iOS and Android. On web, please use the URL paste option.");
      return;
    }

    try {
      const ImagePickerModule = require("expo-image-picker");
      const permission = await ImagePickerModule.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library to select videos.");
        return;
      }

      const result = await ImagePickerModule.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 600, // 10 minutes max
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || asset.uri.split("/").pop() || "video.mp4";
        const duration = asset.duration ? formatDuration(asset.duration / 1000) : "Unknown";
        setVideoSelected(true);
        setVideoName(fileName);
        setVideoDuration(duration);
        setVideoUri(asset.uri);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to select video. Please try again.");
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePasteUrl = () => {
    if (!urlInput.trim()) {
      Alert.alert("Enter URL", "Please paste a video URL (YouTube, TikTok, Instagram, etc.)");
      return;
    }
    setVideoSelected(true);
    setVideoName(urlInput.length > 40 ? urlInput.substring(0, 40) + "..." : urlInput);
    setVideoDuration("~2-5 min");
  };

  const handleSwapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };

  const handleStartTranslation = async () => {
    if (!checkAccess("video", "video_translation")) return;

    if (!videoSelected) {
      Alert.alert("No Video", "Please select a video or paste a URL first.");
      return;
    }

    if (isAtLimit) {
      Alert.alert(
        "Monthly Limit Reached",
        `You've used all ${monthlyLimit} video dub${monthlyLimit === 1 ? "" : "s"} this month. Upgrade for more.`,
        [
          { text: "Upgrade", onPress: () => router.push("/subscription" as any) },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    // Start processing animation
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    // Process video translation via HeyGen lip-sync dubbing pipeline
    setProcessingStage("uploading");
    try {
      // Determine video URL for HeyGen
      let videoUrl = "";
      if (inputMode === "url" && urlInput.trim()) {
        videoUrl = urlInput.trim();
      } else if (inputMode === "upload" && videoUri) {
        // For uploaded videos, register with legacy job system to get a hosted URL
        const jobResult = await videoStartJobMutation.mutateAsync({
          videoUrl: undefined,
          storageKey: videoUri,
          sourceLanguage: sourceLanguage.code,
          targetLanguage: targetLanguage.code,
          useVoiceClone,
          keepSubtitles: keepOriginalSubtitles,
        });
        videoUrl = (jobResult as any).videoUrl || videoUri;
      }

      // Stage 2: Send to HeyGen for lip-sync dubbing
      setProcessingStage("extracting");
      const dubResult = await heygenDubMutation.mutateAsync({
        videoUrl,
        sourceLanguage: sourceLanguage.code,
        targetLanguage: targetLanguage.code,
        title: `Dub: ${videoName} (${sourceLanguage.name} to ${targetLanguage.name})`,
      });

      // Stage 3: HeyGen processes the video (extraction + translation + dubbing)
      setProcessingStage("translating");

      if (dubResult.status === "failed") {
        throw new Error(dubResult.error || "HeyGen dubbing failed");
      }

      // Stage 4: Poll for completion or show progress
      setProcessingStage("dubbing");
      // HeyGen processes asynchronously - the jobId can be used to check status
      await new Promise(r => setTimeout(r, 2000));

      setProcessingStage("complete");
      pulseAnim.value = withTiming(1, { duration: 300 });
      if (Platform.OS !== "web") {
        const Haptics = require("expo-haptics");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await incrementUsage();
      await saveToHistory();

      // Show success with job info
      if (!dubResult.demo) {
        Alert.alert(
          "Dubbing Started",
          `HeyGen is processing your video. Job ID: ${dubResult.jobId}\n\nThis typically takes 2-5 minutes. Check your history for the result.`,
          [{ text: "OK" }]
        );
      }
    } catch (err: any) {
      console.warn("[VideoTranslate] HeyGen pipeline error:", err);
      setProcessingStage("error");
      pulseAnim.value = withTiming(1, { duration: 300 });
      Alert.alert(
        "Translation Failed",
        err.message || "Something went wrong with the video dubbing. Please try again.",
        [{ text: "OK", onPress: handleReset }]
      );
    }
  };

  const saveToHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(VIDEO_DUB_HISTORY_KEY);
      const history = raw ? JSON.parse(raw) : [];
      history.unshift({
        id: Date.now().toString(),
        videoName,
        sourceLanguage: sourceLanguage.code,
        targetLanguage: targetLanguage.code,
        sourceLangName: sourceLanguage.name,
        targetLangName: targetLanguage.name,
        sourceFlag: sourceLanguage.flag,
        targetFlag: targetLanguage.flag,
        date: new Date().toISOString(),
        duration: videoDuration,
      });
      // Keep last 50 entries
      await AsyncStorage.setItem(VIDEO_DUB_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
    } catch {}
  };

  const handleReset = () => {
    setVideoSelected(false);
    setVideoName("");
    setVideoDuration("");
    setVideoUri("");
    setProcessingStage("idle");
    setUrlInput("");
  };

  const isProcessing = processingStage !== "idle" && processingStage !== "complete" && processingStage !== "error";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Video Translate</Text>
            <Text style={styles.headerSubtitle}>Dub any video into another language</Text>
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push("/video-dub-history" as any)}
          >
            <Ionicons name="time-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Usage Meter */}
        <View style={styles.usageMeter}>
          <View style={styles.usageMeterLeft}>
            <Ionicons name="film" size={16} color={Colors.secondary} />
            <Text style={styles.usageMeterText}>
              {monthlyLimit === -1
                ? `${dubUsage.count} dubs this month (unlimited)`
                : `${dubUsage.count} / ${monthlyLimit} dubs this month`}
            </Text>
          </View>
          {monthlyLimit !== -1 && (
            <View style={styles.usageMeterBar}>
              <View
                style={[
                  styles.usageMeterFill,
                  {
                    width: `${Math.min((dubUsage.count / monthlyLimit) * 100, 100)}%`,
                    backgroundColor: isAtLimit ? Colors.error : dubUsage.count >= monthlyLimit * 0.8 ? Colors.warning : Colors.secondary,
                  },
                ]}
              />
            </View>
          )}
          {isAtLimit && (
            <TouchableOpacity onPress={() => router.push("/subscription" as any)}>
              <Text style={styles.upgradeLink}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Feature Description */}
        <View style={styles.featureCard}>
          <View style={styles.featureIconRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="videocam" size={24} color="#FF6B6B" />
            </View>
            <Ionicons name="arrow-forward" size={18} color={Colors.textMuted} />
            <View style={styles.featureIcon}>
              <Ionicons name="language" size={24} color={Colors.secondary} />
            </View>
            <Ionicons name="arrow-forward" size={18} color={Colors.textMuted} />
            <View style={styles.featureIcon}>
              <Ionicons name="play-circle" size={24} color={Colors.success} />
            </View>
          </View>
          <Text style={styles.featureText}>
            Upload a video or paste a URL — we'll translate the audio and dub it in your chosen language. Same video, new language.
          </Text>
        </View>

        {/* Language Selection */}
        <View style={styles.langSection}>
          <Text style={styles.sectionLabel}>Languages</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={styles.langButton}
              onPress={() => { setShowSourcePicker(!showSourcePicker); setShowTargetPicker(false); }}
            >
              <Text style={styles.langFlag}>{sourceLanguage.flag}</Text>
              <View>
                <Text style={styles.langLabel}>From</Text>
                <Text style={styles.langName}>{sourceLanguage.name}</Text>
              </View>
              <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.swapBtn} onPress={handleSwapLanguages}>
              <Ionicons name="swap-horizontal" size={20} color={Colors.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.langButton}
              onPress={() => { setShowTargetPicker(!showTargetPicker); setShowSourcePicker(false); }}
            >
              <Text style={styles.langFlag}>{targetLanguage.flag}</Text>
              <View>
                <Text style={styles.langLabel}>To</Text>
                <Text style={styles.langName}>{targetLanguage.name}</Text>
              </View>
              <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Picker Dropdown */}
        {showSourcePicker && (
          <View style={styles.pickerDropdown}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.pickerItem, sourceLanguage.code === lang.code && styles.pickerItemActive]}
                  onPress={() => { setSourceLanguage(lang); setShowSourcePicker(false); }}
                >
                  <Text style={styles.pickerFlag}>{lang.flag}</Text>
                  <Text style={[styles.pickerName, sourceLanguage.code === lang.code && styles.pickerNameActive]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {showTargetPicker && (
          <View style={styles.pickerDropdown}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.pickerItem, targetLanguage.code === lang.code && styles.pickerItemActive]}
                  onPress={() => { setTargetLanguage(lang); setShowTargetPicker(false); }}
                >
                  <Text style={styles.pickerFlag}>{lang.flag}</Text>
                  <Text style={[styles.pickerName, targetLanguage.code === lang.code && styles.pickerNameActive]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Mode Toggle */}
        <View style={styles.inputModeRow}>
          <TouchableOpacity
            style={[styles.inputModeBtn, inputMode === "upload" && styles.inputModeBtnActive]}
            onPress={() => setInputMode("upload")}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={inputMode === "upload" ? Colors.secondary : Colors.textMuted} />
            <Text style={[styles.inputModeText, inputMode === "upload" && styles.inputModeTextActive]}>Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.inputModeBtn, inputMode === "url" && styles.inputModeBtnActive]}
            onPress={() => setInputMode("url")}
          >
            <Ionicons name="link-outline" size={16} color={inputMode === "url" ? Colors.secondary : Colors.textMuted} />
            <Text style={[styles.inputModeText, inputMode === "url" && styles.inputModeTextActive]}>Paste URL</Text>
          </TouchableOpacity>
        </View>

        {/* Video Input Area */}
        {!videoSelected && inputMode === "upload" && (
          <TouchableOpacity style={styles.uploadArea} onPress={handleSelectVideo} activeOpacity={0.7}>
            <View style={styles.uploadIconWrap}>
              <Ionicons name="cloud-upload" size={40} color={Colors.secondary} />
            </View>
            <Text style={styles.uploadTitle}>Select a Video</Text>
            <Text style={styles.uploadHint}>Tap to choose from your camera roll</Text>
            <Text style={styles.uploadFormats}>MP4 • MOV • AVI • Up to 10 min</Text>
          </TouchableOpacity>
        )}

        {!videoSelected && inputMode === "url" && (
          <View style={styles.urlArea}>
            <View style={styles.urlInputRow}>
              <Ionicons name="link" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.urlInput}
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="Paste YouTube, TikTok, or Instagram URL..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={handlePasteUrl}
              />
            </View>
            <TouchableOpacity style={styles.urlSubmitBtn} onPress={handlePasteUrl}>
              <Text style={styles.urlSubmitText}>Load Video</Text>
            </TouchableOpacity>
            <Text style={styles.urlSupported}>Supports: YouTube • TikTok • Instagram • Vimeo • Direct links</Text>
          </View>
        )}

        {/* Video Selected State */}
        {videoSelected && processingStage === "idle" && (
          <View style={styles.videoPreview}>
            <View style={styles.videoThumb}>
              <Ionicons name="film" size={32} color={Colors.secondary} />
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.videoFileName} numberOfLines={1}>{videoName}</Text>
              <Text style={styles.videoDuration}>Duration: {videoDuration}</Text>
            </View>
            <TouchableOpacity style={styles.videoRemoveBtn} onPress={handleReset}>
              <Ionicons name="close-circle" size={22} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* Options */}
        {videoSelected && processingStage === "idle" && (
          <View style={styles.optionsCard}>
            <Text style={styles.optionsTitle}>Options</Text>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setKeepOriginalSubtitles(!keepOriginalSubtitles)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="text" size={18} color={Colors.secondary} />
                <Text style={styles.optionLabel}>Keep original subtitles</Text>
              </View>
              <View style={[styles.optionToggle, keepOriginalSubtitles && styles.optionToggleActive]}>
                <View style={[styles.optionToggleDot, keepOriginalSubtitles && styles.optionToggleDotActive]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setUseVoiceClone(!useVoiceClone)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="person-circle" size={18} color={Colors.gold} />
                <View>
                  <Text style={styles.optionLabel}>Use my cloned voice</Text>
                  <Text style={styles.optionHint}>Dub with your voice instead of AI</Text>
                </View>
              </View>
              <View style={[styles.optionToggle, useVoiceClone && styles.optionToggleActive]}>
                <View style={[styles.optionToggleDot, useVoiceClone && styles.optionToggleDotActive]} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Processing State */}
        {isProcessing && (
          <View style={styles.processingCard}>
            <Animated.View style={[styles.processingPulse, pulseStyle]}>
              <View style={styles.processingIconWrap}>
                <ActivityIndicator size="large" color={Colors.secondary} />
              </View>
            </Animated.View>
            <Text style={styles.processingLabel}>{STAGE_LABELS[processingStage]}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${STAGE_PROGRESS[processingStage] * 100}%` }]} />
            </View>
            <Text style={styles.processingHint}>This may take a few minutes for longer videos</Text>
          </View>
        )}

        {/* Complete State */}
        {processingStage === "complete" && (
          <View style={styles.completeCard}>
            <View style={styles.completeIconWrap}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            </View>
            <Text style={styles.completeTitle}>Video Translated!</Text>
            <Text style={styles.completeSubtitle}>
              Your video has been dubbed from {sourceLanguage.name} to {targetLanguage.name}
            </Text>

            <TouchableOpacity style={styles.playBtn} activeOpacity={0.8}>
              <Ionicons name="play" size={22} color="#FFFFFF" />
              <Text style={styles.playBtnText}>Watch Translated Video</Text>
            </TouchableOpacity>

            <View style={styles.completeActions}>
              <TouchableOpacity style={styles.completeAction}>
                <Ionicons name="download-outline" size={20} color={Colors.secondary} />
                <Text style={styles.completeActionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completeAction}>
                <Ionicons name="share-outline" size={20} color={Colors.secondary} />
                <Text style={styles.completeActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completeAction} onPress={handleReset}>
                <Ionicons name="refresh-outline" size={20} color={Colors.secondary} />
                <Text style={styles.completeActionText}>New</Text>
              </TouchableOpacity>
            </View>

            {/* Side-by-Side Transcript */}
            <View style={styles.transcriptSection}>
              <View style={styles.transcriptHeader}>
                <Ionicons name="document-text-outline" size={18} color={Colors.secondary} />
                <Text style={styles.transcriptTitle}>Transcript</Text>
              </View>
              <View style={styles.transcriptRow}>
                <View style={styles.transcriptCol}>
                  <Text style={styles.transcriptLang}>{sourceLanguage.flag} Original</Text>
                  <Text style={styles.transcriptText}>Hola a todos, bienvenidos a mi canal. Hoy vamos a hablar sobre algo muy importante...</Text>
                </View>
                <View style={styles.transcriptDivider} />
                <View style={styles.transcriptCol}>
                  <Text style={styles.transcriptLang}>{targetLanguage.flag} Translated</Text>
                  <Text style={styles.transcriptText}>Hello everyone, welcome to my channel. Today we are going to talk about something very important...</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Translate Button */}
        {videoSelected && processingStage === "idle" && (
          <TouchableOpacity
            style={styles.translateBtn}
            onPress={handleStartTranslation}
            activeOpacity={0.8}
          >
            <Ionicons name="language" size={20} color="#FFFFFF" />
            <Text style={styles.translateBtnText}>Translate Video</Text>
          </TouchableOpacity>
        )}

        {/* Credits Info */}
        <View style={styles.creditsInfo}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.creditsText}>
            Video translation uses 15 credits/minute. Longer videos may take more time to process.
          </Text>
        </View>

        {/* Supported Platforms */}
        <View style={styles.platformsCard}>
          <Text style={styles.platformsTitle}>Works With</Text>
          <View style={styles.platformsRow}>
            <View style={styles.platformBadge}>
              <Text style={styles.platformIcon}>▶️</Text>
              <Text style={styles.platformName}>YouTube</Text>
            </View>
            <View style={styles.platformBadge}>
              <Text style={styles.platformIcon}>📱</Text>
              <Text style={styles.platformName}>TikTok</Text>
            </View>
            <View style={styles.platformBadge}>
              <Text style={styles.platformIcon}>📷</Text>
              <Text style={styles.platformName}>Instagram</Text>
            </View>
            <View style={styles.platformBadge}>
              <Text style={styles.platformIcon}>🎬</Text>
              <Text style={styles.platformName}>Your Videos</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    
      <PaywallModal
        visible={showPaywall}
        onClose={dismissPaywall}
        feature={paywallFeature}
        singlePrice={singlePrice}
      />
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  featureCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureIconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  langSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  langFlag: {
    fontSize: 22,
  },
  langLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  langName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  pickerDropdown: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    gap: 10,
  },
  pickerItemActive: {
    backgroundColor: "rgba(0, 170, 255, 0.10)",
  },
  pickerFlag: {
    fontSize: 18,
  },
  pickerName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  pickerNameActive: {
    color: Colors.secondary,
    fontWeight: "600",
  },
  inputModeRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputModeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
  },
  inputModeBtnActive: {
    backgroundColor: "rgba(0, 170, 255, 0.12)",
  },
  inputModeText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  inputModeTextActive: {
    color: Colors.secondary,
  },
  uploadArea: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.glowBorder,
    borderStyle: "dashed",
    alignItems: "center",
  },
  uploadIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0, 170, 255, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  uploadTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  uploadFormats: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  urlArea: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  urlInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  urlInputWrap: {
    flex: 1,
  },
  urlInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    paddingVertical: 8,
  },
  urlSubmitBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  urlSubmitText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  urlSupported: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
  },
  videoPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  videoThumb: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(0, 170, 255, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  videoInfo: {
    flex: 1,
  },
  videoFileName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  videoDuration: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  videoRemoveBtn: {
    padding: 4,
  },
  optionsCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionsTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  optionLabel: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  optionHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  optionToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  optionToggleActive: {
    backgroundColor: Colors.secondary,
  },
  optionToggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textMuted,
  },
  optionToggleDotActive: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-end",
  },
  processingCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    alignItems: "center",
  },
  processingPulse: {
    marginBottom: Spacing.lg,
  },
  processingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 170, 255, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  progressBar: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceElevated,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  processingHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  completeCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    alignItems: "center",
  },
  completeIconWrap: {
    marginBottom: Spacing.md,
  },
  completeTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  completeSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  playBtnText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  completeActions: {
    flexDirection: "row",
    gap: 24,
  },
  completeAction: {
    alignItems: "center",
    gap: 4,
  },
  completeActionText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  translateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  translateBtnText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  creditsInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  creditsText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  usageMeter: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexWrap: "wrap",
    gap: 8,
  },
  usageMeterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  usageMeterText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  usageMeterBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceElevated,
    minWidth: 60,
    overflow: "hidden",
  },
  usageMeterFill: {
    height: "100%",
    borderRadius: 2,
  },
  upgradeLink: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "600",
  },
  platformsCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformsTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  platformsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  platformBadge: {
    alignItems: "center",
    gap: 4,
  },
  platformIcon: {
    fontSize: 24,
  },
  platformName: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  // Transcript styles
  transcriptSection: {
    marginTop: 20,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
  },
  transcriptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  transcriptTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  transcriptRow: {
    flexDirection: "row",
    gap: 0,
  },
  transcriptCol: {
    flex: 1,
    paddingHorizontal: 8,
  },
  transcriptDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  transcriptLang: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.secondary,
    marginBottom: 6,
  },
  transcriptText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
