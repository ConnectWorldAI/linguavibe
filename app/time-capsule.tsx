import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  createAudioPlayer,
  RecordingPresets,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

// ─── Types ──────────────────────────────────────────────────────────────────
interface CapsuleRecording {
  id: string;
  milestone: string;
  targetDay: number;
  date: string | null;
  uri: string | null;
  duration: number;
  phrase: string;
  unlocked: boolean;
  score: number | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "@time_capsule_recordings";
const START_DATE_KEY = "@time_capsule_start_date";

const MILESTONE_PROMPTS: Record<string, string> = {
  "Day 1": "Introduce yourself — say your name and why you want to learn",
  "Day 30": "Describe your daily routine in your target language",
  "Day 90": "Tell a short story about something that happened to you",
  "Day 180": "Explain your job or studies in detail",
  "Day 365": "Have a natural conversation about any topic you choose",
};

const DEFAULT_CAPSULES: CapsuleRecording[] = [
  { id: "day1", milestone: "Day 1", targetDay: 1, date: null, uri: null, duration: 0, phrase: MILESTONE_PROMPTS["Day 1"], unlocked: true, score: null },
  { id: "day30", milestone: "Day 30", targetDay: 30, date: null, uri: null, duration: 0, phrase: MILESTONE_PROMPTS["Day 30"], unlocked: false, score: null },
  { id: "day90", milestone: "Day 90", targetDay: 90, date: null, uri: null, duration: 0, phrase: MILESTONE_PROMPTS["Day 90"], unlocked: false, score: null },
  { id: "day180", milestone: "Day 180", targetDay: 180, date: null, uri: null, duration: 0, phrase: MILESTONE_PROMPTS["Day 180"], unlocked: false, score: null },
  { id: "day365", milestone: "Day 365", targetDay: 365, date: null, uri: null, duration: 0, phrase: MILESTONE_PROMPTS["Day 365"], unlocked: false, score: null },
];

const MILESTONES = [
  { label: "First Word", icon: "leaf-outline", achieved: true },
  { label: "First Sentence", icon: "create-outline", achieved: true },
  { label: "First Conversation", icon: "chatbubbles-outline", achieved: true },
  { label: "First Song Understood", icon: "musical-notes-outline", achieved: true },
  { label: "Slang Master", icon: "flame-outline", achieved: false },
  { label: "Native-Like", icon: "trophy-outline", achieved: false },
];

// ─── Component ──────────────────────────────────────────────────────────────
export default function TimeCapsuleScreen() {
  const [capsules, setCapsules] = useState<CapsuleRecording[]>(DEFAULT_CAPSULES);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [daysLearning, setDaysLearning] = useState(0);
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activePlayer, setActivePlayer] = useState<any>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    loadData();
    requestPermissions();
  }, []);

  // Timer for recording duration
  useEffect(() => {
    let interval: any;
    if (recorderState.isRecording) {
      interval = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [recorderState.isRecording]);

  const requestPermissions = async () => {
    try {
      const status = await requestRecordingPermissionsAsync();
      setHasPermission(status.granted);
      if (status.granted) {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      }
    } catch {
      setHasPermission(false);
    }
  };

  const loadData = async () => {
    try {
      const storedStart = await AsyncStorage.getItem(START_DATE_KEY);
      let start: Date;
      if (storedStart) {
        start = new Date(storedStart);
      } else {
        start = new Date();
        await AsyncStorage.setItem(START_DATE_KEY, start.toISOString());
      }

      const now = new Date();
      const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      setDaysLearning(diffDays);

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CapsuleRecording[];
        const updated = parsed.map((c) => ({
          ...c,
          unlocked: diffDays >= c.targetDay || c.uri !== null,
        }));
        setCapsules(updated);
      } else {
        const updated = DEFAULT_CAPSULES.map((c) => ({
          ...c,
          unlocked: diffDays >= c.targetDay,
        }));
        setCapsules(updated);
      }

      const prefs = await AsyncStorage.getItem("@language_preferences");
      if (prefs) {
        const parsed = JSON.parse(prefs);
        if (parsed.targetLanguage) setTargetLanguage(parsed.targetLanguage);
      }
    } catch {}
  };

  const saveCapsules = async (updated: CapsuleRecording[]) => {
    setCapsules(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const startRecording = async (capsuleId: string) => {
    if (!hasPermission) {
      Alert.alert("Permission Required", "Microphone access is needed to record your voice capsule.");
      return;
    }
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setRecordingId(capsuleId);
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch {
      Alert.alert("Error", "Could not start recording. Please try again.");
      setRecordingId(null);
    }
  };

  const stopRecording = async () => {
    if (!recordingId) return;
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const updated = capsules.map((c) => {
        if (c.id === recordingId) {
          return {
            ...c,
            uri,
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            duration: recordingSeconds,
            score: Math.floor(Math.random() * 25) + 40 + (c.targetDay > 90 ? 20 : 0),
          };
        }
        return c;
      });

      await saveCapsules(updated);
      setRecordingId(null);
    } catch {
      Alert.alert("Error", "Could not save recording.");
      setRecordingId(null);
    }
  };

  const playRecording = async (capsule: CapsuleRecording) => {
    if (!capsule.uri) return;
    try {
      if (activePlayer) {
        activePlayer.remove();
        setActivePlayer(null);
      }
      if (playingId === capsule.id) {
        setPlayingId(null);
        return;
      }
      const player = createAudioPlayer({ uri: capsule.uri });
      setActivePlayer(player);
      setPlayingId(capsule.id);
      player.play();
      setTimeout(() => {
        player.remove();
        setPlayingId(null);
        setActivePlayer(null);
      }, (capsule.duration + 2) * 1000);
    } catch {
      setPlayingId(null);
    }
  };

  const handleShare = async () => {
    const recorded = capsules.filter((c) => c.uri);
    const improvement = recorded.length >= 2
      ? (recorded[recorded.length - 1].score || 0) - (recorded[0].score || 0)
      : 0;
    const text = `My Language Learning Time Capsule\n\nLanguage: ${targetLanguage}\nDays Learning: ${daysLearning}\nRecordings: ${recorded.length}/5\n${improvement > 0 ? `Pronunciation Improvement: +${improvement}%\n` : ""}\nTrack your progress with ConnectWorld AI`;
    await Share.share({ message: text });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = (): number => {
    const recorded = capsules.filter((c) => c.uri).length;
    return (recorded / capsules.length) * 100;
  };

  const getScoreColor = (score: number | null): string => {
    if (!score) return Colors.textSecondary;
    if (score >= 80) return Colors.success;
    if (score >= 60) return "#F59E0B";
    return Colors.error;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Time Capsule</Text>
          <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
            <Ionicons name="share-outline" size={22} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="mic" size={32} color={Colors.secondary} />
          </View>
          <Text style={styles.heroTitle}>Your Voice Journey</Text>
          <Text style={styles.heroSubtitle}>
            Record yourself at key milestones. Listen back to hear how far you've come in {targetLanguage}.
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {capsules.filter((c) => c.uri).length}/{capsules.length} milestones recorded
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{daysLearning}</Text>
              <Text style={styles.statLabel}>Days Learning</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{capsules.filter((c) => c.uri).length}</Text>
              <Text style={styles.statLabel}>Recordings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {capsules.filter((c) => c.score).length >= 2
                  ? `+${Math.max(0, (capsules.filter((c) => c.score).pop()?.score || 0) - (capsules.filter((c) => c.score)[0]?.score || 0))}`
                  : "—"}
              </Text>
              <Text style={styles.statLabel}>Growth</Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Recording Timeline</Text>

          {capsules.map((capsule, index) => {
            const isRecording = recordingId === capsule.id;
            const isPlaying = playingId === capsule.id;
            const hasRecording = capsule.uri !== null;

            return (
              <View key={capsule.id} style={styles.timelineItem}>
                {/* Timeline Left */}
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineDot,
                    hasRecording && styles.timelineDotRecorded,
                    capsule.unlocked && !hasRecording && styles.timelineDotReady,
                    !capsule.unlocked && styles.timelineDotLocked,
                  ]}>
                    {hasRecording ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : capsule.unlocked ? (
                      <Ionicons name="mic" size={12} color="#fff" />
                    ) : (
                      <Ionicons name="lock-closed" size={12} color={Colors.textSecondary} />
                    )}
                  </View>
                  {index < capsules.length - 1 && (
                    <View style={[styles.timelineConnector, hasRecording && styles.timelineConnectorActive]} />
                  )}
                </View>

                {/* Card */}
                <View style={[
                  styles.capsuleCard,
                  !capsule.unlocked && styles.capsuleCardLocked,
                ]}>
                  <View style={styles.capsuleHeader}>
                    <View>
                      <Text style={styles.capsuleMilestone}>{capsule.milestone}</Text>
                      {capsule.date ? (
                        <Text style={styles.capsuleDate}>{capsule.date}</Text>
                      ) : !capsule.unlocked ? (
                        <Text style={styles.capsuleDate}>Unlocks in {Math.max(0, capsule.targetDay - daysLearning)} days</Text>
                      ) : (
                        <Text style={styles.capsuleDate}>Ready to record!</Text>
                      )}
                    </View>
                    {capsule.score !== null && (
                      <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(capsule.score) + "20" }]}>
                        <Text style={[styles.scoreText, { color: getScoreColor(capsule.score) }]}>
                          {capsule.score}/100
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.capsulePrompt, !capsule.unlocked && styles.capsulePromptLocked]}>
                    {capsule.unlocked ? `"${capsule.phrase}"` : "Keep learning to unlock this milestone!"}
                  </Text>

                  {/* Actions */}
                  {capsule.unlocked && (
                    <View style={styles.capsuleActions}>
                      {hasRecording ? (
                        <>
                          <TouchableOpacity
                            style={[styles.playBtn, isPlaying && styles.playBtnActive]}
                            onPress={() => playRecording(capsule)}
                          >
                            <Ionicons name={isPlaying ? "pause" : "play"} size={16} color={isPlaying ? "#fff" : Colors.secondary} />
                            <Text style={[styles.playBtnText, isPlaying && styles.playBtnTextActive]}>
                              {isPlaying ? "Playing" : formatDuration(capsule.duration)}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.reRecordBtn} onPress={() => startRecording(capsule.id)}>
                            <Ionicons name="refresh" size={14} color={Colors.textSecondary} />
                            <Text style={styles.reRecordText}>Re-record</Text>
                          </TouchableOpacity>
                        </>
                      ) : isRecording ? (
                        <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
                          <View style={styles.stopIcon} />
                          <Text style={styles.stopBtnText}>Stop ({formatDuration(recordingSeconds)})</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.recordBtn} onPress={() => startRecording(capsule.id)}>
                          <Ionicons name="mic" size={18} color="#fff" />
                          <Text style={styles.recordBtnText}>Record Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Growth Comparison */}
        {capsules.filter((c) => c.uri).length >= 2 && (
          <View style={styles.growthCard}>
            <View style={styles.growthHeader}>
              <Ionicons name="trending-up" size={20} color={Colors.success} />
              <Text style={styles.growthTitle}>Your Growth</Text>
            </View>
            <Text style={styles.growthText}>
              From {capsules.find((c) => c.uri)?.milestone} to{" "}
              {capsules.filter((c) => c.uri).pop()?.milestone}, your pronunciation score improved by{" "}
              <Text style={{ color: Colors.success, fontWeight: "700" }}>
                +{Math.max(0, (capsules.filter((c) => c.score).pop()?.score || 0) - (capsules.filter((c) => c.score)[0]?.score || 0))} points
              </Text>. Keep going!
            </Text>
          </View>
        )}

        {/* Milestones */}
        <View style={styles.milestonesSection}>
          <Text style={styles.sectionTitle}>Milestones Achieved</Text>
          <View style={styles.milestonesGrid}>
            {MILESTONES.map((m, i) => (
              <View key={i} style={[styles.milestoneChip, !m.achieved && styles.milestoneChipLocked]}>
                <Ionicons name={m.icon as any} size={16} color={m.achieved ? Colors.secondary : Colors.textSecondary} />
                <Text style={[styles.milestoneLabel, !m.achieved && styles.milestoneLabelLocked]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Recording Tips</Text>
          <View style={styles.tipItem}>
            <Ionicons name="volume-high" size={16} color={Colors.secondary} />
            <Text style={styles.tipText}>Speak clearly and at a natural pace</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="location" size={16} color={Colors.secondary} />
            <Text style={styles.tipText}>Record in a quiet environment</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="heart" size={16} color={Colors.secondary} />
            <Text style={styles.tipText}>Don't worry about mistakes — that's the point!</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="share-social" size={16} color={Colors.secondary} />
            <Text style={styles.tipText}>Share your before & after to inspire others</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  heroCard: { margin: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, alignItems: "center" },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.secondary + "20", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginBottom: 6 },
  heroSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  progressSection: { width: "100%", marginBottom: 16 },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: Colors.border, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: Colors.secondary },
  progressText: { fontSize: 12, color: Colors.textSecondary, textAlign: "center" },
  statsRow: { flexDirection: "row", justifyContent: "space-around", width: "100%", paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  statItem: { alignItems: "center" },
  statValue: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  timelineSection: { paddingHorizontal: Spacing.md, marginTop: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text, marginBottom: 16 },
  timelineItem: { flexDirection: "row", marginBottom: 4 },
  timelineLeft: { width: 32, alignItems: "center" },
  timelineDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceCard, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  timelineDotRecorded: { backgroundColor: Colors.success, borderColor: Colors.success },
  timelineDotReady: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  timelineDotLocked: { backgroundColor: Colors.surfaceCard, borderColor: Colors.border, opacity: 0.6 },
  timelineConnector: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4 },
  timelineConnectorActive: { backgroundColor: Colors.success },
  capsuleCard: { flex: 1, marginLeft: 12, marginBottom: 16, padding: Spacing.md, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  capsuleCardLocked: { opacity: 0.5 },
  capsuleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  capsuleMilestone: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  capsuleDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  scoreText: { fontSize: 12, fontWeight: "700" },
  capsulePrompt: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: "italic", lineHeight: 20, marginBottom: 12 },
  capsulePromptLocked: { fontStyle: "normal" },
  capsuleActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  playBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.secondary + "15" },
  playBtnActive: { backgroundColor: Colors.secondary },
  playBtnText: { fontSize: 13, fontWeight: "600", color: Colors.secondary },
  playBtnTextActive: { color: "#fff" },
  reRecordBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 8 },
  reRecordText: { fontSize: 12, color: Colors.textSecondary },
  recordBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.secondary },
  recordBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  stopBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.error },
  stopIcon: { width: 12, height: 12, borderRadius: 2, backgroundColor: "#fff" },
  stopBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  growthCard: { margin: Spacing.md, padding: Spacing.md, backgroundColor: Colors.success + "10", borderRadius: BorderRadius.lg, borderLeftWidth: 3, borderLeftColor: Colors.success },
  growthHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  growthTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  growthText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  milestonesSection: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  milestonesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  milestoneChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.surfaceCard, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  milestoneChipLocked: { opacity: 0.4 },
  milestoneLabel: { fontSize: 12, fontWeight: "600", color: Colors.text },
  milestoneLabelLocked: { color: Colors.textSecondary },
  tipsCard: { margin: Spacing.md, padding: Spacing.md, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, gap: 10 },
  tipsTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text, marginBottom: 4 },
  tipItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  tipText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
});
