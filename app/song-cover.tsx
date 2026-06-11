import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

type FlowStep = "select" | "record" | "preview" | "enhance" | "publish";

type Song = {
  id: string;
  title: string;
  artist: string;
  language: string;
  flag: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

const AVAILABLE_SONGS: Song[] = [
  { id: "1", title: "Tití Me Preguntó", artist: "Bad Bunny", language: "Spanish", flag: "🇵🇷", duration: "3:45", difficulty: "Medium" },
  { id: "2", title: "Despacito", artist: "Luis Fonsi", language: "Spanish", flag: "🇵🇷", duration: "4:42", difficulty: "Easy" },
  { id: "3", title: "La Bicicleta", artist: "Shakira & Carlos Vives", language: "Spanish", flag: "🇨🇴", duration: "3:52", difficulty: "Medium" },
  { id: "4", title: "Papaoutai", artist: "Stromae", language: "French", flag: "🇫🇷", duration: "3:51", difficulty: "Hard" },
  { id: "5", title: "Alors on danse", artist: "Stromae", language: "French", flag: "🇧🇪", duration: "3:28", difficulty: "Medium" },
  { id: "6", title: "Dynamite", artist: "BTS", language: "Korean", flag: "🇰🇷", duration: "3:19", difficulty: "Easy" },
  { id: "7", title: "Sakura", artist: "Ikimono-gakari", language: "Japanese", flag: "🇯🇵", duration: "5:31", difficulty: "Hard" },
  { id: "8", title: "Ai Se Eu Te Pego", artist: "Michel Teló", language: "Portuguese", flag: "🇧🇷", duration: "2:44", difficulty: "Easy" },
  { id: "9", title: "Waka Waka", artist: "Shakira", language: "Spanish", flag: "🇨🇴", duration: "3:22", difficulty: "Easy" },
  { id: "10", title: "Danza Kuduro", artist: "Don Omar", language: "Spanish", flag: "🇵🇷", duration: "3:18", difficulty: "Medium" },
];

export default function SongCoverScreen() {
  const [step, setStep] = useState<FlowStep>("select");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [enhanceLevel, setEnhanceLevel] = useState<"none" | "light" | "full">("light");
  const [caption, setCaption] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
    };
  }, []);

  const filteredSongs = AVAILABLE_SONGS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setWaveformData([]);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    waveRef.current = setInterval(() => {
      setWaveformData((prev) => [...prev.slice(-40), Math.random() * 0.8 + 0.2]);
    }, 100);

    if (Platform.OS !== "web") {
      const Haptics = require("expo-haptics");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setHasRecording(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveRef.current) clearInterval(waveRef.current);

    if (Platform.OS !== "web") {
      const Haptics = require("expo-haptics");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setStep("preview");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishProgress(0);

    // Simulate publishing process
    const interval = setInterval(() => {
      setPublishProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    // Save to local posts
    try {
      const existing = await AsyncStorage.getItem("@user_posts");
      const posts = existing ? JSON.parse(existing) : [];
      posts.unshift({
        id: Date.now().toString(),
        type: "song_cover",
        songTitle: selectedSong?.title,
        artist: selectedSong?.artist,
        language: selectedSong?.language,
        flag: selectedSong?.flag,
        caption,
        duration: formatTime(recordingTime),
        enhanceLevel,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
      });
      await AsyncStorage.setItem("@user_posts", JSON.stringify(posts));
    } catch (e) {
      // Silent fail
    }

    setTimeout(() => {
      setIsPublishing(false);
      if (Platform.OS !== "web") {
        const Haptics = require("expo-haptics");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        "Posted! 🎉",
        "Your song cover is now on your profile.",
        [{ text: "View Profile", onPress: () => router.replace("/(tabs)/profile") }]
      );
    }, 3200);
  };

  // === STEP 1: Song Selection ===
  const renderSelectStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Choose a Song</Text>
        <Text style={styles.stepSubtitle}>Pick a song to record your cover</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, languages..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.songList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.songCard, selectedSong?.id === item.id && styles.songCardSelected]}
            activeOpacity={0.8}
            onPress={() => setSelectedSong(item)}
          >
            <View style={styles.songIcon}>
              <Text style={styles.songFlag}>{item.flag}</Text>
            </View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{item.title}</Text>
              <Text style={styles.songArtist}>{item.artist}</Text>
              <View style={styles.songMeta}>
                <Text style={styles.songLanguage}>{item.language}</Text>
                <View style={[styles.difficultyBadge, item.difficulty === "Easy" ? styles.diffEasy : item.difficulty === "Medium" ? styles.diffMedium : styles.diffHard]}>
                  <Text style={styles.difficultyText}>{item.difficulty}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.songDuration}>{item.duration}</Text>
            {selectedSong?.id === item.id && (
              <View style={styles.checkMark}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {selectedSong && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => setStep("record")}
        >
          <Text style={styles.nextButtonText}>Start Recording</Text>
          <Ionicons name="mic" size={18} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  // === STEP 2: Recording ===
  const renderRecordStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.recordHeader}>
        <View style={styles.songBanner}>
          <Text style={styles.bannerFlag}>{selectedSong?.flag}</Text>
          <View>
            <Text style={styles.bannerTitle}>{selectedSong?.title}</Text>
            <Text style={styles.bannerArtist}>{selectedSong?.artist}</Text>
          </View>
        </View>
      </View>

      {/* Waveform Visualization */}
      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {waveformData.map((val, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: val * 80,
                  backgroundColor: isRecording ? Colors.gold : Colors.secondary,
                  opacity: isRecording ? 0.8 + val * 0.2 : 0.4,
                },
              ]}
            />
          ))}
          {waveformData.length === 0 && (
            <Text style={styles.waveformPlaceholder}>
              {isRecording ? "Recording..." : "Tap the mic to start"}
            </Text>
          )}
        </View>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <View style={[styles.recordDot, isRecording && styles.recordDotActive]} />
        <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
      </View>

      {/* Record Controls */}
      <View style={styles.recordControls}>
        <TouchableOpacity
          style={styles.discardButton}
          onPress={() => {
            if (isRecording) stopRecording();
            setRecordingTime(0);
            setWaveformData([]);
            setHasRecording(false);
          }}
        >
          <Ionicons name="trash-outline" size={22} color={Colors.accent} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <View style={styles.stopIcon} />
          ) : (
            <Ionicons name="mic" size={32} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.doneButton, !hasRecording && styles.doneButtonDisabled]}
          disabled={!hasRecording}
          onPress={() => setStep("preview")}
        >
          <Ionicons name="checkmark" size={22} color={hasRecording ? Colors.success : Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Ionicons name="bulb-outline" size={14} color={Colors.gold} />
        <Text style={styles.tipsText}>Sing along with the instrumental. AI will enhance your vocals after.</Text>
      </View>
    </View>
  );

  // === STEP 3: Preview ===
  const renderPreviewStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.previewHeader}>
        <Text style={styles.stepTitle}>Preview Your Cover</Text>
        <Text style={styles.stepSubtitle}>{selectedSong?.title} • {formatTime(recordingTime)}</Text>
      </View>

      {/* Playback visualization */}
      <View style={styles.previewPlayer}>
        <View style={styles.previewAlbumArt}>
          <Text style={styles.previewFlag}>{selectedSong?.flag}</Text>
          <View style={styles.previewGlowRing} />
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.previewWaveform}>
          {waveformData.slice(0, 30).map((val, i) => (
            <View
              key={i}
              style={[
                styles.previewBar,
                { height: val * 40, backgroundColor: Colors.gold },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.previewActions}>
        <TouchableOpacity
          style={styles.reRecordButton}
          onPress={() => {
            setHasRecording(false);
            setRecordingTime(0);
            setWaveformData([]);
            setStep("record");
          }}
        >
          <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
          <Text style={styles.reRecordText}>Re-record</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.enhanceButton}
          onPress={() => setStep("enhance")}
        >
          <Ionicons name="sparkles" size={18} color={Colors.primary} />
          <Text style={styles.enhanceButtonText}>AI Enhance & Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // === STEP 4: AI Enhancement ===
  const renderEnhanceStep = () => (
    <ScrollView style={styles.stepContainer} contentContainerStyle={styles.enhanceContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>AI Enhancement</Text>
        <Text style={styles.stepSubtitle}>Polish your vocals before posting</Text>
      </View>

      {/* Enhancement levels */}
      <View style={styles.enhanceOptions}>
        <TouchableOpacity
          style={[styles.enhanceOption, enhanceLevel === "none" && styles.enhanceOptionSelected]}
          onPress={() => setEnhanceLevel("none")}
        >
          <Ionicons name="volume-high" size={24} color={enhanceLevel === "none" ? Colors.secondary : Colors.textMuted} />
          <Text style={[styles.enhanceOptionTitle, enhanceLevel === "none" && styles.enhanceOptionTitleActive]}>Raw</Text>
          <Text style={styles.enhanceOptionDesc}>No processing, authentic sound</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.enhanceOption, enhanceLevel === "light" && styles.enhanceOptionSelected]}
          onPress={() => setEnhanceLevel("light")}
        >
          <Ionicons name="sparkles" size={24} color={enhanceLevel === "light" ? Colors.gold : Colors.textMuted} />
          <Text style={[styles.enhanceOptionTitle, enhanceLevel === "light" && styles.enhanceOptionTitleGold]}>Light Polish</Text>
          <Text style={styles.enhanceOptionDesc}>Noise removal, slight pitch correction</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.enhanceOption, enhanceLevel === "full" && styles.enhanceOptionSelected]}
          onPress={() => setEnhanceLevel("full")}
        >
          <Ionicons name="diamond" size={24} color={enhanceLevel === "full" ? Colors.gold : Colors.textMuted} />
          <Text style={[styles.enhanceOptionTitle, enhanceLevel === "full" && styles.enhanceOptionTitleGold]}>Full Studio</Text>
          <Text style={styles.enhanceOptionDesc}>Auto-tune, reverb, EQ, compression</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Caption */}
      <View style={styles.captionSection}>
        <Text style={styles.captionLabel}>Caption</Text>
        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption to your cover..."
          placeholderTextColor={Colors.textMuted}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={200}
        />
        <Text style={styles.captionCount}>{caption.length}/200</Text>
      </View>

      {/* Visibility */}
      <View style={styles.visibilitySection}>
        <Text style={styles.visibilityLabel}>Post to</Text>
        <View style={styles.visibilityOptions}>
          <View style={styles.visibilityOption}>
            <Ionicons name="grid" size={16} color={Colors.secondary} />
            <Text style={styles.visibilityText}>Profile Grid</Text>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          </View>
          <View style={styles.visibilityOption}>
            <Ionicons name="globe" size={16} color={Colors.secondary} />
            <Text style={styles.visibilityText}>Explore Feed</Text>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          </View>
        </View>
      </View>

      {/* Publish Button */}
      {isPublishing ? (
        <View style={styles.publishingContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${publishProgress}%` }]} />
          </View>
          <Text style={styles.publishingText}>
            {publishProgress < 30 ? "Enhancing vocals..." : publishProgress < 60 ? "Mixing audio..." : publishProgress < 90 ? "Uploading..." : "Done!"}
          </Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
          <Ionicons name="arrow-up-circle" size={20} color={Colors.primary} />
          <Text style={styles.publishButtonText}>Post Cover</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === "record") setStep("select");
            else if (step === "preview") setStep("record");
            else if (step === "enhance") setStep("preview");
            else router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Song Cover</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {(["select", "record", "preview", "enhance"] as FlowStep[]).map((s, i) => (
          <View key={s} style={styles.stepDotRow}>
            <View style={[styles.stepDot, step === s && styles.stepDotActive, (["select", "record", "preview", "enhance"].indexOf(step) > i) && styles.stepDotDone]} />
            {i < 3 && <View style={[styles.stepLine, (["select", "record", "preview", "enhance"].indexOf(step) > i) && styles.stepLineDone]} />}
          </View>
        ))}
      </View>

      {/* Step Content */}
      {step === "select" && renderSelectStep()}
      {step === "record" && renderRecordStep()}
      {step === "preview" && renderPreviewStep()}
      {step === "enhance" && renderEnhanceStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  stepIndicator: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: Spacing.sm, gap: 0 },
  stepDotRow: { flexDirection: "row", alignItems: "center" },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  stepDotActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary, width: 12, height: 12, borderRadius: 6 },
  stepDotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.surfaceElevated },
  stepLineDone: { backgroundColor: Colors.success },
  stepContainer: { flex: 1 },
  stepHeader: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  stepTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  stepSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },

  // Song Selection
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, paddingHorizontal: 12, marginHorizontal: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: Colors.textPrimary, fontSize: FontSize.md },
  songList: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  songCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  songCardSelected: { borderColor: Colors.glowBorder, backgroundColor: "rgba(0, 170, 255, 0.06)" },
  songIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center", marginRight: 10 },
  songFlag: { fontSize: 22 },
  songInfo: { flex: 1 },
  songTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  songArtist: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 1 },
  songMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  songLanguage: { fontSize: FontSize.xs, color: Colors.textMuted },
  difficultyBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  diffEasy: { backgroundColor: "rgba(0, 255, 136, 0.12)" },
  diffMedium: { backgroundColor: "rgba(255, 184, 0, 0.12)" },
  diffHard: { backgroundColor: "rgba(255, 45, 45, 0.12)" },
  difficultyText: { fontSize: 9, fontWeight: "700", color: Colors.textSecondary },
  songDuration: { fontSize: FontSize.xs, color: Colors.textMuted, marginRight: 4 },
  checkMark: { position: "absolute", top: 8, right: 8 },
  nextButton: { position: "absolute", bottom: 30, left: Spacing.md, right: Spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.secondary, paddingVertical: 16, borderRadius: BorderRadius.lg },
  nextButtonText: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.primary },

  // Recording
  recordHeader: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  songBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.glowBorder },
  bannerFlag: { fontSize: 28 },
  bannerTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  bannerArtist: { fontSize: FontSize.sm, color: Colors.textSecondary },
  waveformContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: Spacing.md },
  waveform: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 100, gap: 2 },
  waveBar: { width: 4, borderRadius: 2, minHeight: 4 },
  waveformPlaceholder: { fontSize: FontSize.md, color: Colors.textMuted },
  timerContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: Spacing.md },
  recordDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.textMuted },
  recordDotActive: { backgroundColor: Colors.accent },
  timerText: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.textPrimary, fontVariant: ["tabular-nums"] },
  recordControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 30, paddingBottom: Spacing.xl },
  discardButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.redBorder },
  recordButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255, 45, 45, 0.4)" },
  recordButtonActive: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.accent },
  stopIcon: { width: 24, height: 24, borderRadius: 4, backgroundColor: Colors.accent },
  doneButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.greenBorder },
  doneButtonDisabled: { opacity: 0.4 },
  tipsContainer: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingBottom: Spacing.lg },
  tipsText: { fontSize: FontSize.xs, color: Colors.textMuted, maxWidth: "70%" },

  // Preview
  previewHeader: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  previewPlayer: { alignItems: "center", paddingVertical: Spacing.xl },
  previewAlbumArt: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.glowBorder, marginBottom: Spacing.md },
  previewFlag: { fontSize: 48 },
  previewGlowRing: { position: "absolute", width: 130, height: 130, borderRadius: 65, borderWidth: 1, borderColor: "rgba(0, 170, 255, 0.2)" },
  playButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center", marginBottom: Spacing.md },
  previewWaveform: { flexDirection: "row", alignItems: "center", gap: 2, height: 50 },
  previewBar: { width: 3, borderRadius: 2, minHeight: 3 },
  previewActions: { flexDirection: "row", justifyContent: "center", gap: 12, paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },
  reRecordButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  reRecordText: { fontSize: FontSize.md, color: Colors.textSecondary },
  enhanceButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.md, backgroundColor: Colors.gold },
  enhanceButtonText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.primary },

  // Enhance
  enhanceContent: { paddingBottom: 100 },
  enhanceOptions: { paddingHorizontal: Spacing.md, gap: 10, marginBottom: Spacing.lg },
  enhanceOption: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", flexDirection: "column", gap: 4 },
  enhanceOptionSelected: { borderColor: Colors.glowBorder, backgroundColor: "rgba(0, 170, 255, 0.05)" },
  enhanceOptionTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  enhanceOptionTitleActive: { color: Colors.secondary },
  enhanceOptionTitleGold: { color: Colors.gold },
  enhanceOptionDesc: { fontSize: FontSize.sm, color: Colors.textMuted },
  proBadge: { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(255, 184, 0, 0.15)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  proBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.gold },
  captionSection: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  captionLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: 6 },
  captionInput: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, minHeight: 80, textAlignVertical: "top", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  captionCount: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: "right", marginTop: 4 },
  visibilitySection: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  visibilityLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: 8 },
  visibilityOptions: { gap: 8 },
  visibilityOption: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.sm, padding: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  visibilityText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary },
  publishingContainer: { paddingHorizontal: Spacing.md, alignItems: "center", gap: 10 },
  progressBar: { width: "100%", height: 6, borderRadius: 3, backgroundColor: Colors.surfaceCard, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.gold, borderRadius: 3 },
  publishingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  publishButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: Spacing.md, backgroundColor: Colors.gold, paddingVertical: 16, borderRadius: BorderRadius.lg },
  publishButtonText: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.primary },
});
