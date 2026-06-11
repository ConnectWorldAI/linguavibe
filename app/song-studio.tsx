import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const { width } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────────────────────────

type StudioStep = "upload" | "processing" | "stems" | "translate" | "translating" | "result";

interface StemData {
  vocalsUrl: string;
  instrumentsUrl: string;
  duration: number;
  bpm?: number;
  key?: string;
}

interface TranslationResult {
  translatedVocalsUrl: string;
  originalLyrics: string;
  translatedLyrics: string;
  language: string;
}

// ─── Supported Languages ─────────────────────────────────────────────────────

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
  { code: "tl", name: "Tagalog", flag: "🇵🇭" },
];

// ─── Copyright Notice ────────────────────────────────────────────────────────

const COPYRIGHT_NOTICE = {
  title: "Personal Use Only",
  message: "Song Studio processes songs you own for personal language learning. Translated vocals are derivative works for educational use only. Do not redistribute commercially.",
  acceptText: "I understand — this is for my personal learning",
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SongStudioScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ songUrl?: string; songName?: string }>();

  // State
  const [step, setStep] = useState<StudioStep>("upload");
  const [songFile, setSongFile] = useState<{ uri: string; name: string } | null>(null);
  const [stems, setStems] = useState<StemData | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isPlayingVocals, setIsPlayingVocals] = useState(false);
  const [isPlayingInstruments, setIsPlayingInstruments] = useState(false);
  const [isPlayingTranslated, setIsPlayingTranslated] = useState(false);
  const [useVoiceClone, setUseVoiceClone] = useState(false);
  const [voiceSampleRecorded, setVoiceSampleRecorded] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [copyrightAccepted, setCopyrightAccepted] = useState(false);
  const [exportFormat, setExportFormat] = useState<"mp3" | "wav" | "m4a">("mp3");
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Animations
  const pulseAnim = useSharedValue(1);
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  // If song was passed via params (from song-player or What's Hot)
  useEffect(() => {
    if (params.songUrl && params.songName) {
      setSongFile({ uri: params.songUrl, name: params.songName });
      setCopyrightAccepted(true); // Already in our system
    }
  }, [params.songUrl, params.songName]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handlePickSong = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSongFile({ uri: asset.uri, name: asset.name || "Unknown Song" });
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick audio file. Please try again.");
    }
  };

  const handleAcceptCopyright = () => {
    setCopyrightAccepted(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleProcessSong = async () => {
    if (!songFile) return;

    setStep("processing");
    setProcessingProgress(0);

    // Simulate processing progress (real implementation calls server)
    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      // TODO: Call server endpoint for stem isolation
      // const result = await trpc.songStudio.isolateStems.mutate({ audioUrl: songFile.uri });

      // Simulated result for UI demonstration
      await new Promise((resolve) => setTimeout(resolve, 3000));
      clearInterval(progressInterval);
      setProcessingProgress(100);

      setStems({
        vocalsUrl: songFile.uri + "#vocals",
        instrumentsUrl: songFile.uri + "#instruments",
        duration: 210,
        bpm: 120,
        key: "C minor",
      });

      setTimeout(() => {
        setStep("stems");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      Alert.alert("Processing Error", "Could not process the song. Please try a different file.");
      setStep("upload");
    }
  };

  const handleTranslate = async () => {
    if (!selectedLanguage || !stems) return;

    setStep("translating");
    setProcessingProgress(0);

    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 12;
      });
    }, 600);

    try {
      // TODO: Call server endpoint for vocal translation
      // const result = await trpc.songStudio.translateVocals.mutate({
      //   vocalsUrl: stems.vocalsUrl,
      //   instrumentsUrl: stems.instrumentsUrl,
      //   targetLanguage: selectedLanguage,
      //   useVoiceClone,
      //   bpm: stems.bpm,
      //   key: stems.key,
      // });

      await new Promise((resolve) => setTimeout(resolve, 4000));
      clearInterval(progressInterval);
      setProcessingProgress(100);

      const langName = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name || selectedLanguage;

      setTranslationResult({
        translatedVocalsUrl: stems.vocalsUrl + `#translated_${selectedLanguage}`,
        originalLyrics: "Original lyrics would appear here...",
        translatedLyrics: `Translated lyrics in ${langName} would appear here...`,
        language: langName,
      });

      setTimeout(() => {
        setStep("result");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      Alert.alert("Translation Error", "Could not translate vocals. Please try again.");
      setStep("stems");
    }
  };

  const handleRecordVoiceSample = () => {
    // TODO: Implement voice recording for clone
    Alert.alert(
      "Record Your Voice",
      "Sing or speak for 10 seconds so we can learn your voice. Your voice data stays private and is only used for this translation.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Recording",
          onPress: () => {
            // Simulate recording
            setTimeout(() => {
              setVoiceSampleRecorded(true);
              setUseVoiceClone(true);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }, 2000);
          },
        },
      ]
    );
  };

  const handleExport = () => {
    setShowExportOptions(true);
  };

  const handleBounce = (format: "mp3" | "wav" | "m4a") => {
    setExportFormat(format);
    setShowExportOptions(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // TODO: Call server to render final mix in selected format
    // await trpc.songStudio.bounce.mutate({ translatedVocalsUrl, instrumentsUrl, format });
    Alert.alert(
      `Bounced as .${format.toUpperCase()} 🎵`,
      `Your translated song has been exported as ${format.toUpperCase()} and saved to your device. For personal learning use only.`,
      [{ text: "Open File", onPress: () => {} }, { text: "Done", onPress: () => router.back() }]
    );
  };

  const handleAskCloudWave = () => {
    router.push({
      pathname: "/hume-call",
      params: { mode: "cloudwave", persona: "cloudwave", context: "song_studio" },
    } as any);
  };

  // ─── Render Steps ──────────────────────────────────────────────────────────────

  const renderUploadStep = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Song Studio</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Translate any song into any language — same melody, same vibe
        </Text>
      </View>

      {/* CloudWave Quick Action */}
      <TouchableOpacity
        style={[styles.cloudWaveBtn, { backgroundColor: "#06B6D4" }]}
        onPress={handleAskCloudWave}
      >
        <Ionicons name="mic" size={20} color="#fff" />
        <Text style={styles.cloudWaveBtnText}>
          Ask CloudWave: "Translate this song to French"
        </Text>
      </TouchableOpacity>

      <Text style={[styles.orDivider, { color: colors.muted }]}>— or do it manually —</Text>

      {/* Upload Area */}
      {!songFile ? (
        <TouchableOpacity
          style={[styles.uploadArea, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={handlePickSong}
        >
          <Ionicons name="musical-notes" size={48} color={colors.primary} />
          <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Pick a Song</Text>
          <Text style={[styles.uploadHint, { color: colors.muted }]}>
            Choose from your music library
          </Text>
          <Text style={[styles.uploadFormats, { color: colors.muted }]}>
            MP3, WAV, M4A, FLAC supported
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.songCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.songCardIcon}>
            <Ionicons name="musical-note" size={32} color={colors.primary} />
          </View>
          <View style={styles.songCardInfo}>
            <Text style={[styles.songName, { color: colors.foreground }]} numberOfLines={1}>
              {songFile.name}
            </Text>
            <Text style={[styles.songStatus, { color: colors.success }]}>Ready to process</Text>
          </View>
          <TouchableOpacity onPress={() => setSongFile(null)}>
            <Ionicons name="close-circle" size={24} color={colors.muted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Copyright Notice */}
      {songFile && !copyrightAccepted && (
        <Animated.View entering={FadeIn.duration(300)} style={[styles.copyrightCard, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
          <Ionicons name="shield-checkmark" size={24} color="#D97706" />
          <Text style={[styles.copyrightTitle, { color: "#92400E" }]}>{COPYRIGHT_NOTICE.title}</Text>
          <Text style={[styles.copyrightText, { color: "#78350F" }]}>{COPYRIGHT_NOTICE.message}</Text>
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: "#D97706" }]}
            onPress={handleAcceptCopyright}
          >
            <Text style={styles.acceptBtnText}>{COPYRIGHT_NOTICE.acceptText}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Process Button */}
      {songFile && copyrightAccepted && (
        <Animated.View entering={FadeIn.duration(300)}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={handleProcessSong}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Separate Vocals & Instruments</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* How It Works */}
      <View style={[styles.howItWorks, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.howTitle, { color: colors.foreground }]}>How It Works</Text>
        {[
          { icon: "musical-notes", text: "Pick a song you own" },
          { icon: "git-branch", text: "AI separates vocals from instruments" },
          { icon: "language", text: "Choose your target language" },
          { icon: "mic", text: "AI sings in that language (or your voice!)" },
          { icon: "download", text: "Export your translated song" },
        ].map((item, i) => (
          <View key={i} style={styles.howStep}>
            <View style={[styles.howStepNum, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name={item.icon as any} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.howStepText, { color: colors.foreground }]}>{item.text}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const renderProcessingStep = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.processingContainer}>
      <View style={styles.processingVisual}>
        <Ionicons name="musical-notes" size={64} color={colors.primary} />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
      </View>
      <Text style={[styles.processingTitle, { color: colors.foreground }]}>
        {step === "translating" ? "Translating Vocals..." : "Isolating Stems..."}
      </Text>
      <Text style={[styles.processingSubtitle, { color: colors.muted }]}>
        {step === "translating"
          ? "AI is singing your song in a new language"
          : "AI is separating vocals from instruments"}
      </Text>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: `${Math.min(processingProgress, 100)}%` },
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color: colors.muted }]}>
        {Math.round(processingProgress)}%
      </Text>
    </Animated.View>
  );

  const renderStemsStep = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
      <Text style={[styles.title, { color: colors.foreground }]}>Stems Ready! 🎉</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Your song has been separated. Listen to each track:
      </Text>

      {/* Vocals Track */}
      <TouchableOpacity
        style={[styles.trackCard, { backgroundColor: colors.surface, borderColor: isPlayingVocals ? colors.primary : colors.border }]}
        onPress={() => setIsPlayingVocals(!isPlayingVocals)}
      >
        <View style={[styles.trackIcon, { backgroundColor: "#8B5CF6" + "20" }]}>
          <Ionicons name="person" size={24} color="#8B5CF6" />
        </View>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, { color: colors.foreground }]}>Vocals Only</Text>
          <Text style={[styles.trackDetail, { color: colors.muted }]}>Isolated vocal track</Text>
        </View>
        <Ionicons
          name={isPlayingVocals ? "pause-circle" : "play-circle"}
          size={36}
          color="#8B5CF6"
        />
      </TouchableOpacity>

      {/* Instruments Track */}
      <TouchableOpacity
        style={[styles.trackCard, { backgroundColor: colors.surface, borderColor: isPlayingInstruments ? colors.primary : colors.border }]}
        onPress={() => setIsPlayingInstruments(!isPlayingInstruments)}
      >
        <View style={[styles.trackIcon, { backgroundColor: "#F59E0B" + "20" }]}>
          <Ionicons name="musical-note" size={24} color="#F59E0B" />
        </View>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, { color: colors.foreground }]}>Instruments Only</Text>
          <Text style={[styles.trackDetail, { color: colors.muted }]}>
            Beat: {stems?.bpm || "—"} BPM • Key: {stems?.key || "—"}
          </Text>
        </View>
        <Ionicons
          name={isPlayingInstruments ? "pause-circle" : "play-circle"}
          size={36}
          color="#F59E0B"
        />
      </TouchableOpacity>

      {/* Translate Section */}
      <View style={styles.translateSection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Now translate the vocals:
        </Text>

        {/* Language Grid */}
        <View style={styles.languageGrid}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.langChip,
                {
                  backgroundColor: selectedLanguage === lang.code ? colors.primary : colors.surface,
                  borderColor: selectedLanguage === lang.code ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setSelectedLanguage(lang.code);
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.langName,
                  { color: selectedLanguage === lang.code ? "#fff" : colors.foreground },
                ]}
              >
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Voice Clone Option */}
        <View style={[styles.voiceCloneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.voiceCloneHeader}>
            <Ionicons name="mic" size={20} color="#EC4899" />
            <Text style={[styles.voiceCloneTitle, { color: colors.foreground }]}>
              Use My Voice
            </Text>
            <Text style={[styles.voiceCloneBadge, { backgroundColor: "#EC4899" + "20", color: "#EC4899" }]}>
              PRO
            </Text>
          </View>
          <Text style={[styles.voiceCloneDesc, { color: colors.muted }]}>
            AI will sing the translated lyrics in your own voice
          </Text>
          {!voiceSampleRecorded ? (
            <TouchableOpacity
              style={[styles.recordBtn, { borderColor: "#EC4899" }]}
              onPress={handleRecordVoiceSample}
            >
              <Ionicons name="mic-outline" size={16} color="#EC4899" />
              <Text style={[styles.recordBtnText, { color: "#EC4899" }]}>
                Record 10s Voice Sample
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.voiceRecorded}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.voiceRecordedText, { color: colors.success }]}>
                Voice sample ready — will use your voice!
              </Text>
            </View>
          )}
        </View>

        {/* Translate Button */}
        {selectedLanguage && (
          <Animated.View entering={FadeIn.duration(300)}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleTranslate}
            >
              <Ionicons name="language" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>
                Translate to {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name}
                {useVoiceClone ? " (My Voice)" : ""}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );

  const renderResultStep = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
      <Text style={[styles.title, { color: colors.foreground }]}>Translation Complete! 🎶</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Your song now sings in {translationResult?.language}
      </Text>

      {/* Translated Track */}
      <TouchableOpacity
        style={[styles.trackCard, styles.resultTrack, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}
        onPress={() => setIsPlayingTranslated(!isPlayingTranslated)}
      >
        <View style={[styles.trackIcon, { backgroundColor: colors.primary + "20" }]}>
          <Ionicons name="globe" size={24} color={colors.primary} />
        </View>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, { color: colors.foreground }]}>
            {songFile?.name} ({translationResult?.language})
          </Text>
          <Text style={[styles.trackDetail, { color: colors.muted }]}>
            {useVoiceClone ? "Your voice • " : "AI voice • "}
            Same melody & beat
          </Text>
        </View>
        <Ionicons
          name={isPlayingTranslated ? "pause-circle" : "play-circle"}
          size={36}
          color={colors.primary}
        />
      </TouchableOpacity>

      {/* Lyrics Comparison */}
      <View style={[styles.lyricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.lyricsTitle, { color: colors.foreground }]}>Lyrics Side-by-Side</Text>
        <View style={styles.lyricsColumns}>
          <View style={styles.lyricsCol}>
            <Text style={[styles.lyricsLabel, { color: colors.muted }]}>Original</Text>
            <Text style={[styles.lyricsText, { color: colors.foreground }]}>
              {translationResult?.originalLyrics}
            </Text>
          </View>
          <View style={[styles.lyricsDivider, { backgroundColor: colors.border }]} />
          <View style={styles.lyricsCol}>
            <Text style={[styles.lyricsLabel, { color: colors.primary }]}>
              {translationResult?.language}
            </Text>
            <Text style={[styles.lyricsText, { color: colors.foreground }]}>
              {translationResult?.translatedLyrics}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.learnLyricsBtn, { backgroundColor: colors.primary + "15" }]}
          onPress={() => router.push("/lyrics-player" as any)}
        >
          <Ionicons name="school" size={16} color={colors.primary} />
          <Text style={[styles.learnLyricsBtnText, { color: colors.primary }]}>
            Learn These Lyrics (Karaoke Mode)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Export Format Picker */}
      {showExportOptions && (
        <Animated.View entering={FadeIn.duration(200)} style={[styles.exportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.exportTitle, { color: colors.foreground }]}>Bounce As:</Text>
          <View style={styles.exportFormats}>
            {(["mp3", "wav", "m4a"] as const).map((fmt) => (
              <TouchableOpacity
                key={fmt}
                style={[
                  styles.exportFormatBtn,
                  {
                    backgroundColor: exportFormat === fmt ? colors.primary : colors.background,
                    borderColor: exportFormat === fmt ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleBounce(fmt)}
              >
                <Ionicons
                  name={fmt === "mp3" ? "musical-note" : fmt === "wav" ? "pulse" : "disc"}
                  size={20}
                  color={exportFormat === fmt ? "#fff" : colors.foreground}
                />
                <Text style={[styles.exportFormatLabel, { color: exportFormat === fmt ? "#fff" : colors.foreground }]}>
                  .{fmt.toUpperCase()}
                </Text>
                <Text style={[styles.exportFormatDesc, { color: exportFormat === fmt ? "#ffffffcc" : colors.muted }]}>
                  {fmt === "mp3" ? "Smallest file" : fmt === "wav" ? "Lossless quality" : "Apple format"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.success }]}
          onPress={handleExport}
        >
          <Ionicons name="download" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Bounce as MP3</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#8B5CF6" }]}
          onPress={() => {
            setStep("stems");
            setSelectedLanguage(null);
            setTranslationResult(null);
            setShowExportOptions(false);
          }}
        >
          <Ionicons name="language" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Try Another Language</Text>
        </TouchableOpacity>
      </View>

      {/* Share */}
      <TouchableOpacity
        style={[styles.shareBtn, { borderColor: colors.border }]}
        onPress={() => {
          // TODO: Share short clip
          Alert.alert("Share", "Share a 30-second learning clip with friends (copyright-safe)");
        }}
      >
        <Ionicons name="share-social" size={20} color={colors.primary} />
        <Text style={[styles.shareBtnText, { color: colors.primary }]}>
          Share 30s Learning Clip
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // ─── Main Render ───────────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Back Button */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        {step !== "upload" && (
          <TouchableOpacity
            onPress={() => {
              if (step === "stems" || step === "translate") setStep("upload");
              else if (step === "result") setStep("stems");
            }}
            style={styles.resetBtn}
          >
            <Ionicons name="refresh" size={20} color={colors.muted} />
            <Text style={[styles.resetText, { color: colors.muted }]}>Start Over</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === "upload" && renderUploadStep()}
        {(step === "processing" || step === "translating") && renderProcessingStep()}
        {(step === "stems" || step === "translate") && renderStemsStep()}
        {step === "result" && renderResultStep()}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: { padding: 8 },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 8 },
  resetText: { fontSize: 14 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  stepContainer: { gap: 16 },
  header: { gap: 4, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 15, lineHeight: 22 },

  // CloudWave
  cloudWaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  cloudWaveBtnText: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },
  orDivider: { textAlign: "center", fontSize: 13, marginVertical: 4 },

  // Upload
  uploadArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  uploadTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  uploadHint: { fontSize: 14 },
  uploadFormats: { fontSize: 12, marginTop: 4 },

  // Song Card
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  songCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a7ea4" + "15",
  },
  songCardInfo: { flex: 1 },
  songName: { fontSize: 15, fontWeight: "600" },
  songStatus: { fontSize: 13, marginTop: 2 },

  // Copyright
  copyrightCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  copyrightTitle: { fontSize: 16, fontWeight: "700" },
  copyrightText: { fontSize: 13, lineHeight: 20 },
  acceptBtn: { padding: 12, borderRadius: 8, alignItems: "center", marginTop: 4 },
  acceptBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  // Primary Button
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // How It Works
  howItWorks: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 12, marginTop: 8 },
  howTitle: { fontSize: 16, fontWeight: "700" },
  howStep: { flexDirection: "row", alignItems: "center", gap: 12 },
  howStepNum: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  howStepText: { fontSize: 14, flex: 1 },

  // Processing
  processingContainer: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16 },
  processingVisual: { alignItems: "center" },
  processingTitle: { fontSize: 22, fontWeight: "700" },
  processingSubtitle: { fontSize: 15, textAlign: "center" },
  progressBar: { width: "80%", height: 6, borderRadius: 3, overflow: "hidden", marginTop: 8 },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 14, fontWeight: "600" },

  // Track Cards
  trackCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  resultTrack: { borderWidth: 2 },
  trackIcon: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 15, fontWeight: "600" },
  trackDetail: { fontSize: 13, marginTop: 2 },

  // Translate Section
  translateSection: { gap: 16, marginTop: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },

  // Language Grid
  languageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  langFlag: { fontSize: 16 },
  langName: { fontSize: 13, fontWeight: "500" },

  // Voice Clone
  voiceCloneCard: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
  voiceCloneHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  voiceCloneTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  voiceCloneBadge: { fontSize: 11, fontWeight: "700", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  voiceCloneDesc: { fontSize: 13, lineHeight: 19 },
  recordBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 8, borderWidth: 1, alignSelf: "flex-start" },
  recordBtnText: { fontSize: 13, fontWeight: "600" },
  voiceRecorded: { flexDirection: "row", alignItems: "center", gap: 6 },
  voiceRecordedText: { fontSize: 13, fontWeight: "500" },

  // Result
  lyricsCard: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
  lyricsTitle: { fontSize: 16, fontWeight: "700" },
  lyricsColumns: { flexDirection: "row", gap: 12 },
  lyricsCol: { flex: 1, gap: 4 },
  lyricsLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  lyricsText: { fontSize: 14, lineHeight: 22 },
  lyricsDivider: { width: 1 },
  learnLyricsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 10, borderRadius: 8 },
  learnLyricsBtnText: { fontSize: 13, fontWeight: "600" },

  // Export Format Picker
  exportCard: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
  exportTitle: { fontSize: 16, fontWeight: "700" },
  exportFormats: { flexDirection: "row", gap: 10 },
  exportFormatBtn: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  exportFormatLabel: { fontSize: 14, fontWeight: "700" },
  exportFormatDesc: { fontSize: 11 },

  // Actions
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 14, borderRadius: 12 },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  shareBtnText: { fontSize: 14, fontWeight: "600" },
});
