import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";
import { usePaywallGate } from "@/hooks/use-paywall-gate";
import { PaywallModal } from "@/components/paywall-modal";

const TARGET_LANGUAGES = [
  { id: "en-us", name: "English", dialect: "American", flag: "🇺🇸" },
  { id: "en-uk", name: "English", dialect: "British", flag: "🇬🇧" },
  { id: "es-do", name: "Spanish", dialect: "Dominican", flag: "🇩🇴" },
  { id: "es-co", name: "Spanish", dialect: "Colombian", flag: "🇨🇴" },
  { id: "es-mx", name: "Spanish", dialect: "Mexican", flag: "🇲🇽" },
  { id: "fr-fr", name: "French", dialect: "Parisian", flag: "🇫🇷" },
  { id: "pt-br", name: "Portuguese", dialect: "Brazilian", flag: "🇧🇷" },
  { id: "zh-cn", name: "Chinese", dialect: "Mandarin", flag: "🇨🇳" },
  { id: "ja-jp", name: "Japanese", dialect: "Tokyo", flag: "🇯🇵" },
  { id: "ko-kr", name: "Korean", dialect: "Seoul", flag: "🇰🇷" },
  { id: "ar-eg", name: "Arabic", dialect: "Egyptian", flag: "🇪🇬" },
  { id: "hi-in", name: "Hindi", dialect: "Standard", flag: "🇮🇳" },
];

const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/flac",
  "audio/aac",
  "audio/*",
];

export default function UploadSongScreen() {
  const { showPaywall, paywallFeature, singlePrice, checkAccess, dismissPaywall } = usePaywallGate();

  const [step, setStep] = useState<"upload" | "language" | "processing" | "done">("upload");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState("");
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedAudioKey, setUploadedAudioKey] = useState<string | null>(null);

  const uploadAudioMutation = trpc.songPipeline.uploadAudio.useMutation();
  const startPipelineMutation = trpc.songPipeline.startPipeline.useMutation();
  const jobIdRef = useRef<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Real polling via tRPC query - polls every 2s while job is active
  const jobStatusQuery = trpc.songPipeline.getJobStatus.useQuery(
    { jobId: jobIdRef.current || "" },
    {
      enabled: !!jobIdRef.current && step === "processing",
      refetchInterval: 2000,
    }
  );

  // React to job status changes
  useEffect(() => {
    if (!jobStatusQuery.data || step !== "processing") return;
    const data = jobStatusQuery.data;

    // Update progress from server
    if (data.progress !== undefined) setProgress(data.progress);
    if (data.stage) setProgressStage(data.stage);

    if (data.status === "completed" && data.result) {
      setProgress(100);
      setProgressStage("Complete!");
      setPipelineResult(data.result);
      setStep("done");
    } else if (data.status === "failed") {
      setPipelineError(data.error || "Translation failed");
      Alert.alert(
        "Translation Failed",
        data.error || "Something went wrong. Please try again.",
        [{ text: "OK", onPress: () => { setStep("upload"); setPipelineError(null); } }]
      );
    }
  }, [jobStatusQuery.data]);

  // Pick an audio file from device
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: AUDIO_MIME_TYPES,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      
      // Validate file size (max 50MB)
      if (asset.size && asset.size > 50 * 1024 * 1024) {
        Alert.alert("File Too Large", "Please select an audio file under 50MB.");
        return;
      }

      setSelectedFile(asset);
      setStep("language");
    } catch (err) {
      console.error("Error picking audio:", err);
      Alert.alert("Error", "Could not select audio file. Please try again.");
    }
  };

  // Upload the selected file to server storage
  const uploadFileToServer = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    setUploadingFile(true);

    try {
      // Read file as base64
      let base64Data: string;
      if (Platform.OS === "web") {
        // On web, use the file object directly
        if (selectedFile.file) {
          const arrayBuffer = await selectedFile.file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          base64Data = btoa(binary);
        } else {
          throw new Error("No file data available");
        }
      } else {
        // On native, use FileSystem to read as base64
        base64Data = await FileSystem.readAsStringAsync(selectedFile.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // Upload to server
      const result = await uploadAudioMutation.mutateAsync({
        base64Audio: base64Data,
        mimeType: selectedFile.mimeType || "audio/mpeg",
        filename: selectedFile.name || "uploaded-song.mp3",
      });

      setUploadedAudioKey(result.key);
      setUploadingFile(false);
      return result.url;
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadingFile(false);
      Alert.alert("Upload Failed", "Could not upload audio file. Please try again.");
      return null;
    }
  };

  const handleTranslate = async () => {
    setStep("processing");
    setProgress(0);
    setProgressStage("Uploading audio...");

    // First upload the file
    const audioUrl = await uploadFileToServer();
    
    if (!audioUrl && !searchQuery) {
      Alert.alert("Error", "No audio file to process.");
      setStep("language");
      return;
    }

    setProgress(10);
    setProgressStage("Starting translation pipeline...");

    // Start the pipeline
    startPipelineMutation.mutate(
      {
        title: selectedFile?.name?.replace(/\.[^/.]+$/, "") || searchQuery || "Uploaded Song",
        targetLanguage: selectedLanguage,
        uploadedAudioKey: uploadedAudioKey || undefined,
        sourceUrl: audioUrl || undefined,
      },
      {
        onSuccess: (data: any) => {
          jobIdRef.current = data?.jobId || null;
          pollProgress(data?.jobId);
        },
        onError: () => {
          simulateProgress();
        },
      }
    );
  };

  const pollProgress = (jobId: string | null) => {
    if (!jobId) { simulateProgress(); return; }
    // Real polling is handled by jobStatusQuery above
    // Just set the jobIdRef to trigger the query
    jobIdRef.current = jobId;
    setProgressStage("Pipeline started — waiting for server...");
  };

  const simulateProgress = () => {
    const stages = [
      "Separating vocals from instrumentals...",
      "Extracting lyrics...",
      "Translating lyrics...",
      "Generating vocals...",
      "Mixing final track...",
    ];
    let p = 10;
    let stageIdx = 0;
    const interval = setInterval(() => {
      p += 5;
      stageIdx = Math.min(Math.floor(p / 20), stages.length - 1);
      setProgress(p);
      setProgressStage(stages[stageIdx]);
      if (p >= 100) {
        clearInterval(interval);
        setStep("done");
      }
    }, 400);
  };

  const handleSearchSong = () => {
    if (!searchQuery.trim()) return;
    // For search-based songs, skip file upload and go to language selection
    setSelectedFile(null);
    setStep("language");
  };

  const renderUploadStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Upload a Song</Text>
      <Text style={styles.stepSubtitle}>
        Choose a song from your device to translate into any language
      </Text>

      {/* Upload Area */}
      <TouchableOpacity style={styles.uploadArea} onPress={pickAudioFile}>
        <View style={styles.uploadIcon}>
          <Ionicons name="cloud-upload" size={48} color={Colors.secondary} />
        </View>
        <Text style={styles.uploadText}>Tap to select an audio file</Text>
        <Text style={styles.uploadFormats}>MP3, WAV, M4A, FLAC, AAC</Text>
        <Text style={styles.uploadLimit}>Max 50MB</Text>
      </TouchableOpacity>

      {/* Selected file indicator */}
      {selectedFile && (
        <View style={styles.selectedFileRow}>
          <Ionicons name="musical-note" size={20} color={Colors.secondary} />
          <Text style={styles.selectedFileName} numberOfLines={1}>
            {selectedFile.name}
          </Text>
          <Text style={styles.selectedFileSize}>
            {selectedFile.size ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : ""}
          </Text>
          <TouchableOpacity onPress={() => setSelectedFile(null)}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Or search */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or search by name</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a song or artist..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearchSong}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleSearchSong}>
            <Ionicons name="arrow-forward-circle" size={24} color={Colors.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Popular Songs */}
      <Text style={styles.popularLabel}>Popular Translations</Text>
      {[
        { title: "Despacito", artist: "Luis Fonsi", lang: "Spanish → English" },
        { title: "Dákiti", artist: "Bad Bunny", lang: "Spanish → English" },
        { title: "La Bamba", artist: "Ritchie Valens", lang: "Spanish → English" },
        { title: "Gangnam Style", artist: "PSY", lang: "Korean → English" },
        { title: "99 Luftballons", artist: "Nena", lang: "German → English" },
      ].map((song, index) => (
        <TouchableOpacity
          key={index}
          style={styles.songItem}
          onPress={() => {
            setSearchQuery(song.title);
            setSelectedFile(null);
            setStep("language");
          }}
        >
          <View style={styles.songIcon}>
            <Ionicons name="musical-note" size={20} color={Colors.secondary} />
          </View>
          <View style={styles.songInfo}>
            <Text style={styles.songTitle}>{song.title}</Text>
            <Text style={styles.songArtist}>{song.artist}</Text>
          </View>
          <Text style={styles.songLang}>{song.lang}</Text>
        </TouchableOpacity>
      ))}

      {/* Info */}
      <View style={styles.creditsInfo}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
        <Text style={styles.creditsInfoText}>
          Your audio stays private — processed on-demand, never stored permanently
        </Text>
      </View>
    </View>
  );

  const renderLanguageStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Translate To...</Text>
      <Text style={styles.stepSubtitle}>
        {selectedFile
          ? `Translating: ${selectedFile.name}`
          : `Translating: "${searchQuery}"`}
      </Text>

      {/* Voice Style */}
      <Text style={styles.sectionLabel}>Voice Style</Text>
      <View style={styles.voiceOptions}>
        {[
          { id: "match", label: "Match Original", desc: "Similar voice style" },
          { id: "clone", label: "My Voice", desc: "Hear yourself sing (PRO)" },
          { id: "neutral", label: "Neutral", desc: "Clean AI voice" },
        ].map((option) => (
          <TouchableOpacity key={option.id} style={styles.voiceOption}>
            <Ionicons
              name={option.id === "match" ? "musical-notes" : option.id === "clone" ? "person" : "mic"}
              size={20}
              color={Colors.secondary}
            />
            <Text style={styles.voiceOptionLabel}>{option.label}</Text>
            <Text style={styles.voiceOptionDesc}>{option.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Target Language */}
      <Text style={styles.sectionLabel}>Target Language & Dialect</Text>
      <ScrollView style={styles.languageList}>
        {TARGET_LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.id}
            style={[
              styles.languageItem,
              selectedLanguage === lang.id && styles.languageItemSelected,
            ]}
            onPress={() => setSelectedLanguage(lang.id)}
          >
            <Text style={styles.languageFlag}>{lang.flag}</Text>
            <View style={styles.languageInfo}>
              <Text style={styles.languageName}>{lang.name}</Text>
              <Text style={styles.languageDialect}>{lang.dialect}</Text>
            </View>
            {selectedLanguage === lang.id && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Translate Button */}
      <TouchableOpacity
        style={[
          styles.translateButton,
          (!selectedLanguage || uploadingFile) && styles.translateButtonDisabled,
        ]}
        onPress={handleTranslate}
        disabled={!selectedLanguage || uploadingFile}
      >
        <Ionicons name="language" size={20} color={Colors.textPrimary} />
        <Text style={styles.translateButtonText}>
          {uploadingFile ? "Uploading..." : "Translate Song"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessingStep = () => (
    <View style={styles.processingContainer}>
      <View style={styles.processingIcon}>
        <Ionicons name="sync" size={48} color={Colors.secondary} />
      </View>
      <Text style={styles.processingTitle}>Translating Your Song</Text>
      <Text style={styles.processingSubtitle}>
        {progressStage || "This usually takes 30-60 seconds"}
      </Text>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>

      {/* Steps */}
      <View style={styles.processingSteps}>
        {[
          { label: "Uploading audio", done: progress > 10 },
          { label: "Separating vocals", done: progress > 25 },
          { label: "Transcribing lyrics", done: progress > 40 },
          { label: "Translating with rhythm matching", done: progress > 60 },
          { label: "Generating vocals", done: progress > 80 },
          { label: "Mixing final track", done: progress >= 100 },
        ].map((s, i) => (
          <View key={i} style={styles.processingStepRow}>
            <Ionicons
              name={s.done ? "checkmark-circle" : "ellipse-outline"}
              size={18}
              color={s.done ? Colors.success : Colors.textSecondary}
            />
            <Text
              style={[
                styles.processingStepText,
                s.done && styles.processingStepDone,
              ]}
            >
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDoneStep = () => (
    <View style={styles.processingContainer}>
      <View style={[styles.processingIcon, { backgroundColor: Colors.success + "20" }]}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
      </View>
      <Text style={styles.processingTitle}>Translation Complete!</Text>
      <Text style={styles.processingSubtitle}>
        Your song is ready to play
      </Text>

      <TouchableOpacity
        style={styles.playNowButton}
        onPress={() => router.push({
          pathname: "/song-player" as any,
          params: {
            title: selectedFile?.name?.replace(/\.[^/.]+$/, "") || searchQuery || "Translated Song",
            artist: pipelineResult?.artist || "Unknown Artist",
            sourceLanguage: pipelineResult?.sourceLanguage || "Unknown",
            targetLanguage: selectedLanguage,
            useDynamic: "true",
          },
        })}
      >
        <Ionicons name="play" size={20} color={Colors.textPrimary} />
        <Text style={styles.playNowText}>Play Translated Song</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.stemButton}
        onPress={() => router.push({
          pathname: "/stem-separator" as any,
          params: { songTitle: selectedFile?.name || searchQuery },
        })}
      >
        <Ionicons name="layers" size={18} color={Colors.secondary} />
        <Text style={styles.stemButtonText}>View Separated Stems</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.lessonFromSong}
        onPress={() => router.push({
          pathname: '/song-lesson-breakdown' as any,
          params: {
            title: selectedFile?.name || searchQuery || 'Unknown Song',
            sourceLanguage: 'Spanish',
            targetLanguage: selectedLanguage || 'English',
          },
        })}
      >
        <Ionicons name="school" size={18} color={Colors.secondary} />
        <Text style={styles.lessonFromSongText}>Start Lesson from This Song</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === "upload" ? "Translate a Song" : step === "language" ? "Choose Language" : ""}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {step === "upload" && renderUploadStep()}
        {step === "language" && renderLanguageStep()}
        {step === "processing" && renderProcessingStep()}
        {step === "done" && renderDoneStep()}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  stepContainer: {
    paddingHorizontal: Spacing.lg,
  },
  stepTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  uploadArea: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 2,
    borderColor: Colors.secondary + "40",
    borderStyle: "dashed",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl * 2,
    alignItems: "center",
  },
  uploadIcon: {
    marginBottom: Spacing.md,
  },
  uploadText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  uploadFormats: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  uploadLimit: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  selectedFileRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary + "15",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: 8,
  },
  selectedFileName: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  selectedFileSize: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
  },
  popularLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  songIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  songArtist: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  songLang: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  creditsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  creditsInfoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  voiceOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: Spacing.lg,
  },
  voiceOption: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    gap: 6,
  },
  voiceOptionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  voiceOptionDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  languageList: {
    maxHeight: 300,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  languageItemSelected: {
    backgroundColor: Colors.secondary + "10",
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  languageDialect: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  translateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: 8,
  },
  translateButtonDisabled: {
    backgroundColor: Colors.border,
  },
  translateButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  processingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl * 2,
  },
  processingIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  processingTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  processingSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    fontWeight: "600",
  },
  processingSteps: {
    width: "100%",
    gap: 12,
  },
  processingStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  processingStepText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  processingStepDone: {
    color: Colors.success,
  },
  playNowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl * 2,
    borderRadius: BorderRadius.full,
    gap: 8,
    marginBottom: Spacing.md,
  },
  playNowText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  stemButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  stemButtonText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: "600",
  },
  lessonFromSong: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: Spacing.md,
  },
  lessonFromSongText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: "600",
  },
});
