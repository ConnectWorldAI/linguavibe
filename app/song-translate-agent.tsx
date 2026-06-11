/**
 * Song Translation Agent Flow
 * 
 * One-tap agent that orchestrates the full song translation pipeline:
 * 1. User provides song URL or uploads audio
 * 2. Agent shows real-time progress through each stage
 * 3. Upon completion, navigates to the dual synced lyrics player
 * 
 * Stages: Isolate → Transcribe → Translate → Synthesize → Mix
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { trpc } from "@/lib/trpc";
import { useUsage } from "@/lib/usage-context";
import { saveSongToLibrary } from "@/lib/song-library";

const Colors = {
  bg: "#0A0E1A",
  surface: "#141825",
  surfaceElevated: "#1C2235",
  accent: "#00AAFF",
  accentGlow: "rgba(0,170,255,0.15)",
  gold: "#FFD700",
  success: "#00E676",
  error: "#FF5252",
  warning: "#FF9F43",
  text: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  purple: "#8B5CF6",
};

type PipelineStage = "idle" | "isolating" | "transcribing" | "translating" | "synthesizing" | "mixing" | "completed" | "failed";

const STAGE_INFO: Record<PipelineStage, { label: string; icon: string; description: string }> = {
  idle: { label: "Ready", icon: "rocket", description: "Paste a song URL or upload audio to begin" },
  isolating: { label: "Isolating Vocals", icon: "cut", description: "Separating vocals from instrumentals..." },
  transcribing: { label: "Extracting Lyrics", icon: "document-text", description: "Transcribing vocals with timestamps..." },
  translating: { label: "Translating", icon: "language", description: "Translating lyrics with rhythm awareness..." },
  synthesizing: { label: "Re-Singing", icon: "mic", description: "Generating vocals in target language..." },
  mixing: { label: "Final Mix", icon: "musical-notes", description: "Mixing translated vocals with instrumentals..." },
  completed: { label: "Complete!", icon: "checkmark-circle", description: "Your translated song is ready!" },
  failed: { label: "Failed", icon: "alert-circle", description: "Something went wrong. Try again." },
};

const SUPPORTED_LANGUAGES = [
  { code: "es", name: "Spanish", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "en", name: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "fr", name: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "de", name: "German", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "pt", name: "Portuguese", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "ja", name: "Japanese", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "ko", name: "Korean", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "it", name: "Italian", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "zh", name: "Mandarin", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "ar", name: "Arabic", flag: "\u{1F1F8}\u{1F1E6}" },
];

export default function SongTranslateAgentScreen() {
  const params = useLocalSearchParams<{
    url?: string;
    title?: string;
    artist?: string;
    sourceLanguage?: string;
  }>();

  const { incrementUsage } = useUsage();
  const [songUrl, setSongUrl] = useState(params.url || "");
  const [title, setTitle] = useState(params.title || "");
  const [artist, setArtist] = useState(params.artist || "");
  const [sourceLanguage] = useState(params.sourceLanguage || "auto");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [showLanguages, setShowLanguages] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState<"natural" | "clone" | "match_original">("match_original");

  // Pipeline state
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [translatedLyrics, setTranslatedLyrics] = useState<any[]>([]);
  const [quality, setQuality] = useState<any>(null);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [waveLoudMode, setWaveLoudMode] = useState(false);

  // Animations
  const pulseScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  // tRPC mutations
  const startPipelineMutation = trpc.songPipeline.startPipeline.useMutation();
  const getJobStatusQuery = trpc.songPipeline.getJobStatus.useQuery(
    { jobId: jobId || "" },
    { enabled: false }
  );

  // Pulse animation for active stages
  useEffect(() => {
    if (stage !== "idle" && stage !== "completed" && stage !== "failed") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [stage]);

  // Progress bar animation
  useEffect(() => {
    progressWidth.value = withTiming(progress / 100, { duration: 500 });
  }, [progress]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  // Start the pipeline
  const handleStart = useCallback(async () => {
    if (!songUrl && !title) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setStage("isolating");
    setProgress(5);
    setError(null);
    incrementUsage("song");

    try {
      const result = await startPipelineMutation.mutateAsync({
        sourceUrl: songUrl || undefined,
        title: title || undefined,
        artist: artist || undefined,
        sourceLanguage,
        targetLanguage,
        voiceStyle,
        preserveRhyme: true,
        preserveSyllables: true,
        preserveMelody: true,
        outputFormat: "mp3",
      });

      setJobId(result.jobId);

      // Start polling for status
      pollTimer.current = setInterval(async () => {
        try {
          const status = await getJobStatusQuery.refetch();
          if (status.data) {
            const { status: jobStatus, progress: jobProgress, stage: jobStage, result: jobResult } = status.data;

            setProgress(jobProgress || 0);

            // Map job status to our stage
            if (jobStatus === "isolating") setStage("isolating");
            else if (jobStatus === "transcribing") setStage("transcribing");
            else if (jobStatus === "translating") setStage("translating");
            else if (jobStatus === "synthesizing") setStage("synthesizing");
            else if (jobStatus === "mixing") setStage("mixing");
            else if (jobStatus === "completed") {
              setStage("completed");
              setProgress(100);
              if (jobResult) {
                setTranslatedLyrics(jobResult.translatedLyrics || []);
                setQuality(jobResult.quality || null);
              }
              if (pollTimer.current) clearInterval(pollTimer.current);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } else if (jobStatus === "failed") {
              setStage("failed");
              setError(status.data.error || "Pipeline failed");
              if (pollTimer.current) clearInterval(pollTimer.current);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            }
          }
        } catch {
          // Polling error - continue
        }
      }, 2000);
    } catch (err: any) {
      setStage("failed");
      setError(err.message || "Failed to start pipeline");
    }
  }, [songUrl, title, artist, sourceLanguage, targetLanguage, voiceStyle]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  // Save to My Library
  const handleSaveToLibrary = useCallback(async () => {
    if (isSaved) return;
    setIsSaving(true);
    try {
      await saveSongToLibrary({
        title: title || "Translated Song",
        artist: artist || "Unknown Artist",
        sourceLanguage: sourceLanguage === "auto" ? "Spanish" : sourceLanguage,
        targetLanguage: SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage)?.name || targetLanguage,
        voiceStyle,
        quality: quality || undefined,
        jobId: jobId || undefined,
      });
      setIsSaved(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Error", "Failed to save song to library");
    } finally {
      setIsSaving(false);
    }
  }, [title, artist, sourceLanguage, targetLanguage, voiceStyle, quality, jobId, isSaved]);

  // Download / Export translated song
  const handleDownload = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // In production, this would download the actual mixed audio file from the server
    Alert.alert(
      "Download Ready",
      "Your translated song will be saved to your device. Connect ElevenLabs API to enable full audio export.",
      [{ text: "OK" }]
    );
  }, []);

  // Share
  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out this song I translated! "${title || "Translated Song"}" by ${artist || "Unknown"} — translated to ${SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage)?.name || targetLanguage} using ConnectWorld AI`,
      });
    } catch {}
  }, [title, artist, targetLanguage]);

  // Start Lesson from translated song
  const handleStartLesson = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/song-lesson-breakdown",
      params: {
        title: title || "Translated Song",
        artist: artist || "Unknown Artist",
        sourceLanguage: sourceLanguage === "auto" ? "Spanish" : sourceLanguage,
        targetLanguage: SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage)?.name || targetLanguage,
      },
    } as any);
  }, [title, artist, sourceLanguage, targetLanguage]);

  // WaveLoud One-Button Mode — agent does everything automatically
  const handleWaveLoudAutomate = useCallback(async () => {
    if (!songUrl && !title) {
      Alert.alert("WaveLoud", "Please enter a song URL or title first, then I'll handle everything!");
      return;
    }
    setWaveLoudMode(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    // Auto-start the pipeline
    handleStart();
  }, [songUrl, title, handleStart]);

  // Navigate to lyrics player when complete
  const handleViewResult = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/song-player",
      params: {
        title: title || "Translated Song",
        artist: artist || "Unknown Artist",
        sourceLanguage: sourceLanguage === "auto" ? "Spanish" : sourceLanguage,
        targetLanguage: SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage)?.name || targetLanguage,
        useDynamic: "true",
      },
    } as any);
  }, [title, artist, sourceLanguage, targetLanguage]);

  const stageInfo = STAGE_INFO[stage];
  const selectedLang = SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Song Translation</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Agent Status Orb */}
        <View style={styles.orbContainer}>
          <Animated.View style={[styles.orb, pulseStyle]}>
            <View style={[styles.orbInner, stage === "completed" && { backgroundColor: Colors.success + "20" }]}>
              <Ionicons
                name={stageInfo.icon as any}
                size={40}
                color={stage === "completed" ? Colors.success : stage === "failed" ? Colors.error : Colors.accent}
              />
            </View>
          </Animated.View>
          <Text style={styles.stageLabel}>{stageInfo.label}</Text>
          <Text style={styles.stageDescription}>{stageInfo.description}</Text>
        </View>

        {/* Progress Bar (visible during processing) */}
        {stage !== "idle" && stage !== "completed" && stage !== "failed" && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, progressBarStyle]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </Animated.View>
        )}

        {/* Pipeline Stages Indicator */}
        {stage !== "idle" && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.stagesRow}>
            {(["isolating", "transcribing", "translating", "synthesizing", "mixing"] as PipelineStage[]).map((s, i) => {
              const isComplete = getStageOrder(stage) > getStageOrder(s);
              const isCurrent = stage === s;
              return (
                <View key={s} style={styles.stageItem}>
                  <View style={[
                    styles.stageDot,
                    isComplete && styles.stageDotComplete,
                    isCurrent && styles.stageDotCurrent,
                  ]}>
                    {isComplete && <Ionicons name="checkmark" size={10} color="#fff" />}
                  </View>
                  <Text style={[styles.stageItemText, (isComplete || isCurrent) && styles.stageItemTextActive]}>
                    {["Split", "Lyrics", "Translate", "Sing", "Mix"][i]}
                  </Text>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Input Section (visible when idle) */}
        {stage === "idle" && (
          <Animated.View entering={FadeInDown.delay(100)} style={styles.inputSection}>
            {/* Song URL Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Song URL (Spotify, YouTube, Apple Music)</Text>
              <View style={styles.inputRow}>
                <Ionicons name="link" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Paste song URL..."
                  placeholderTextColor={Colors.textMuted}
                  value={songUrl}
                  onChangeText={setSongUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Or manual title/artist */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Or enter song details</Text>
              <View style={styles.inputRow}>
                <Ionicons name="musical-notes" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Song title..."
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
              <View style={[styles.inputRow, { marginTop: 8 }]}>
                <Ionicons name="person" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Artist..."
                  placeholderTextColor={Colors.textMuted}
                  value={artist}
                  onChangeText={setArtist}
                />
              </View>
            </View>

            {/* Target Language Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Translate to</Text>
              <TouchableOpacity
                style={styles.langSelector}
                onPress={() => setShowLanguages(!showLanguages)}
              >
                <Text style={styles.langSelectorText}>
                  {selectedLang?.flag} {selectedLang?.name}
                </Text>
                <Ionicons name={showLanguages ? "chevron-up" : "chevron-down"} size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              {showLanguages && (
                <View style={styles.langGrid}>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[styles.langOption, targetLanguage === lang.code && styles.langOptionActive]}
                      onPress={() => {
                        setTargetLanguage(lang.code);
                        setShowLanguages(false);
                      }}
                    >
                      <Text style={styles.langOptionText}>{lang.flag} {lang.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Voice Style */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Voice Style</Text>
              <View style={styles.voiceOptions}>
                {([
                  { key: "match_original", label: "Match Original", icon: "person-circle" },
                  { key: "natural", label: "Natural AI", icon: "sparkles" },
                  { key: "clone", label: "My Voice", icon: "mic" },
                ] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.voiceOption, voiceStyle === opt.key && styles.voiceOptionActive]}
                    onPress={() => setVoiceStyle(opt.key)}
                  >
                    <Ionicons name={opt.icon as any} size={16} color={voiceStyle === opt.key ? Colors.accent : Colors.textSecondary} />
                    <Text style={[styles.voiceOptionText, voiceStyle === opt.key && { color: Colors.accent }]}>
                      {opt.label}
                    </Text>
                    {opt.key === "clone" && (
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* WaveLoud One-Button Mode */}
            <TouchableOpacity
              style={[styles.waveLoudButton, (!songUrl && !title) && styles.startButtonDisabled]}
              onPress={handleWaveLoudAutomate}
              disabled={!songUrl && !title}
            >
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.waveLoudButtonText}>WaveLoud: Do Everything</Text>
              <View style={styles.agentBadge}>
                <Text style={styles.agentBadgeText}>AI AGENT</Text>
              </View>
            </TouchableOpacity>

            {/* Manual Start Button */}
            <TouchableOpacity
              style={[styles.startButton, (!songUrl && !title) && styles.startButtonDisabled]}
              onPress={handleStart}
              disabled={!songUrl && !title}
            >
              <Ionicons name="rocket" size={20} color="#fff" />
              <Text style={styles.startButtonText}>Translate Song (Manual)</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Completion Section */}
        {stage === "completed" && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.completionSection}>
            {/* Quality Metrics */}
            {quality && (
              <View style={styles.qualityCard}>
                <Text style={styles.qualityTitle}>Translation Quality</Text>
                <View style={styles.qualityGrid}>
                  <QualityMetric label="Syllable Match" value={quality.syllableMatch} />
                  <QualityMetric label="Rhyme" value={quality.rhymePreservation} />
                  <QualityMetric label="Meaning" value={quality.meaningPreservation} />
                  <QualityMetric label="Singability" value={quality.singability} />
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <TouchableOpacity style={styles.playResultButton} onPress={handleViewResult}>
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.playResultText}>Open Synced Lyrics Player</Text>
            </TouchableOpacity>

            {/* Save to Library */}
            <TouchableOpacity
              style={[styles.actionRow, isSaved && { opacity: 0.6 }]}
              onPress={handleSaveToLibrary}
              disabled={isSaved || isSaving}
            >
              <Ionicons name={isSaved ? "checkmark-circle" : "bookmark"} size={20} color={isSaved ? Colors.success : Colors.gold} />
              <Text style={[styles.actionRowText, isSaved && { color: Colors.success }]}>
                {isSaved ? "Saved to My Library" : isSaving ? "Saving..." : "Save to My Library"}
              </Text>
            </TouchableOpacity>

            {/* Download / Export */}
            <TouchableOpacity style={styles.actionRow} onPress={handleDownload}>
              <Ionicons name="download" size={20} color={Colors.accent} />
              <Text style={styles.actionRowText}>Download Translated Song</Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity style={styles.actionRow} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color={Colors.purple} />
              <Text style={styles.actionRowText}>Share</Text>
            </TouchableOpacity>

            {/* Start Lesson */}
            <TouchableOpacity style={styles.actionRow} onPress={handleStartLesson}>
              <Ionicons name="school" size={20} color={Colors.warning} />
              <Text style={styles.actionRowText}>Start Lesson from This Song</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStage("idle")}>
              <Ionicons name="refresh" size={20} color={Colors.accent} />
              <Text style={styles.secondaryButtonText}>Translate Another Song</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Error Section */}
        {stage === "failed" && error && (
          <Animated.View entering={FadeInDown} style={styles.errorSection}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { setStage("idle"); setError(null); }}>
              <Ionicons name="refresh" size={18} color={Colors.accent} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper component for quality metrics
function QualityMetric({ label, value }: { label: string; value: number }) {
  const percent = Math.round(value * 100);
  const color = percent >= 85 ? Colors.success : percent >= 70 ? Colors.warning : Colors.error;
  return (
    <View style={styles.qualityItem}>
      <Text style={styles.qualityValue}>{percent}%</Text>
      <View style={styles.qualityBarBg}>
        <View style={[styles.qualityBarFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.qualityLabel}>{label}</Text>
    </View>
  );
}

function getStageOrder(stage: PipelineStage): number {
  const order: Record<PipelineStage, number> = {
    idle: 0, isolating: 1, transcribing: 2, translating: 3, synthesizing: 4, mixing: 5, completed: 6, failed: -1,
  };
  return order[stage];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600", color: Colors.text },
  content: { flex: 1 },
  contentInner: { padding: 20, paddingBottom: 40 },

  // Orb
  orbContainer: { alignItems: "center", marginBottom: 24 },
  orb: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.accentGlow, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  orbInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(0,170,255,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,170,255,0.3)" },
  stageLabel: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  stageDescription: { fontSize: 14, color: Colors.textSecondary, textAlign: "center" },

  // Progress
  progressContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.accent, borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: "600", color: Colors.accent, width: 40, textAlign: "right" },

  // Stages row
  stagesRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingHorizontal: 4 },
  stageItem: { alignItems: "center", gap: 4 },
  stageDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  stageDotComplete: { backgroundColor: Colors.success, borderColor: Colors.success },
  stageDotCurrent: { backgroundColor: Colors.accent + "30", borderColor: Colors.accent },
  stageItemText: { fontSize: 10, color: Colors.textMuted },
  stageItemTextActive: { color: Colors.text },

  // Input section
  inputSection: { gap: 16 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  textInput: { flex: 1, fontSize: 15, color: Colors.text },

  // Language selector
  langSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  langSelectorText: { fontSize: 15, color: Colors.text },
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  langOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  langOptionActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  langOptionText: { fontSize: 13, color: Colors.text },

  // Voice options
  voiceOptions: { gap: 8 },
  voiceOption: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  voiceOptionActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  voiceOptionText: { fontSize: 14, color: Colors.textSecondary },
  proBadge: { backgroundColor: Colors.gold + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: "auto" },
  proBadgeText: { fontSize: 9, fontWeight: "700", color: Colors.gold },

  // Start button
  startButton: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  startButtonDisabled: { opacity: 0.4 },
  startButtonText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  // Completion
  completionSection: { gap: 16 },
  qualityCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  qualityTitle: { fontSize: 15, fontWeight: "600", color: Colors.text, marginBottom: 12 },
  qualityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  qualityItem: { width: "46%", gap: 4 },
  qualityValue: { fontSize: 18, fontWeight: "700", color: Colors.text },
  qualityBarBg: { height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" },
  qualityBarFill: { height: "100%", borderRadius: 2 },
  qualityLabel: { fontSize: 11, color: Colors.textSecondary },

  playResultButton: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  playResultText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  secondaryButtonText: { fontSize: 15, color: Colors.accent, fontWeight: "600" },

  // WaveLoud button
  waveLoudButton: { backgroundColor: "#7C3AED", borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, position: "relative" },
  waveLoudButtonText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  agentBadge: { position: "absolute", top: -6, right: 12, backgroundColor: Colors.gold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  agentBadgeText: { fontSize: 8, fontWeight: "800", color: "#000" },

  // Action rows
  actionRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: Colors.border },
  actionRowText: { fontSize: 15, color: Colors.text, fontWeight: "500" },

  // Error
  errorSection: { alignItems: "center", gap: 12 },
  errorText: { fontSize: 14, color: Colors.error, textAlign: "center" },
  retryButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.accent },
  retryButtonText: { fontSize: 14, color: Colors.accent, fontWeight: "600" },
});
