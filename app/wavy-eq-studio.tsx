import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
  Modal,
  Share,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { saveSubmission } from "@/lib/wavy-eq-submissions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────
type RecordingMode = "full" | "punch-in" | "word-by-word";
type StudioState = "idle" | "recording" | "paused" | "mixing" | "done";

type PunchSection = {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  recorded: boolean;
};

// ─── Mock Song Data ──────────────────────────────────────────────────────────
const MOCK_SONG = {
  title: "Vivir Mi Vida",
  artist: "Marc Anthony",
  language: "Spanish",
  sections: [
    { id: "s1", startTime: 0, endTime: 8, text: "Voy a reír, voy a bailar", recorded: false },
    { id: "s2", startTime: 8, endTime: 16, text: "Vivir mi vida, la la la la", recorded: false },
    { id: "s3", startTime: 16, endTime: 24, text: "Voy a reír, voy a gozar", recorded: false },
    { id: "s4", startTime: 24, endTime: 32, text: "Vivir mi vida, la la la la", recorded: false },
    { id: "s5", startTime: 32, endTime: 42, text: "A veces llega la lluvia para limpiar las heridas", recorded: false },
    { id: "s6", startTime: 42, endTime: 52, text: "A veces solo una gota puede vencer la sequía", recorded: false },
  ] as PunchSection[],
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function WavyEqStudioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ assignmentTitle?: string; lyrics?: string; mode?: string }>();

  // Build sections from route params (song lyrics) or fall back to mock data
  const initialSections = React.useMemo(() => {
    if (params.lyrics) {
      const lines = params.lyrics.split("\n").filter(l => l.trim());
      return lines.map((line, i) => ({
        id: `s${i + 1}`,
        startTime: i * 8,
        endTime: (i + 1) * 8,
        text: line,
        recorded: false,
      }));
    }
    return MOCK_SONG.sections;
  }, [params.lyrics]);

  // Determine initial recording mode from route params
  const initialMode: RecordingMode = React.useMemo(() => {
    if (params.mode === "punch_in" || params.mode === "punch-in") return "punch-in";
    if (params.mode === "word-by-word" || params.mode === "word_by_word") return "word-by-word";
    if (params.mode === "full") return "full";
    return "full";
  }, [params.mode]);

  // Derive song title from params or mock
  const songTitle = params.assignmentTitle || `${MOCK_SONG.title} — ${MOCK_SONG.artist}`;

  const [studioState, setStudioState] = useState<StudioState>("idle");
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(initialMode);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sections, setSections] = useState(initialSections);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [vuLevel, setVuLevel] = useState(0);
  const [gain, setGain] = useState(75);
  const [monitorOn, setMonitorOn] = useState(true);
  const [mixingProgress, setMixingProgress] = useState(0);
  const [showModeSelect, setShowModeSelect] = useState(!params.mode);

  // MP3 Bounce/Export state
  const [showBounceModal, setShowBounceModal] = useState(false);
  const [bounceFormat, setBounceFormat] = useState<"mp3" | "wav" | "m4a">("mp3");
  const [isBouncing, setIsBouncing] = useState(false);
  const [bounceProgress, setBounceProgress] = useState(0);
  const [bounceComplete, setBounceComplete] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const vuAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const mixAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vuRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation for recording
  useEffect(() => {
    if (studioState === "recording") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      // VU meter simulation
      vuRef.current = setInterval(() => {
        setVuLevel(40 + Math.random() * 50);
      }, 150);
    } else {
      pulseAnim.setValue(1);
      if (vuRef.current) clearInterval(vuRef.current);
      setVuLevel(0);
    }
    return () => { if (vuRef.current) clearInterval(vuRef.current); };
  }, [studioState]);

  // Glow animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Recording timer
  useEffect(() => {
    if (studioState === "recording") {
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [studioState]);

  // Mixing animation
  useEffect(() => {
    if (studioState === "mixing") {
      setMixingProgress(0);
      const interval = setInterval(() => {
        setMixingProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => setStudioState("done"), 500);
            return 100;
          }
          return p + 2;
        });
      }, 80);
      return () => clearInterval(interval);
    }
  }, [studioState]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRecord = () => {
    if (studioState === "idle" || studioState === "paused") {
      setStudioState("recording");
      setShowModeSelect(false);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (studioState === "recording") {
      setStudioState("paused");
      if (recordingMode === "punch-in" || recordingMode === "word-by-word") {
        const updated = [...sections];
        updated[currentSectionIdx] = { ...updated[currentSectionIdx], recorded: true };
        setSections(updated);
      }
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStop = () => {
    setStudioState("idle");
    setRecordingTime(0);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleFinish = () => {
    setStudioState("mixing");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleNextSection = () => {
    if (currentSectionIdx < sections.length - 1) {
      setCurrentSectionIdx(currentSectionIdx + 1);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIdx > 0) {
      setCurrentSectionIdx(currentSectionIdx - 1);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // ─── MP3 Bounce/Export Handler ────────────────────────────────────────────
  const handleBounce = async () => {
    setIsBouncing(true);
    setBounceProgress(0);
    setBounceComplete(false);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const interval = setInterval(() => {
      setBounceProgress((prev: number) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 120);

    setTimeout(async () => {
      clearInterval(interval);
      setBounceProgress(100);
      setIsBouncing(false);
      setBounceComplete(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      try {
        const bounceHistory = JSON.parse(await AsyncStorage.getItem("@bounce_exports") || "[]");
        bounceHistory.unshift({
          id: `bounce_${Date.now()}`,
          title: songTitle,
          mode: recordingMode,
          format: bounceFormat,
          duration: recordingTime,
          timestamp: Date.now(),
        });
        await AsyncStorage.setItem("@bounce_exports", JSON.stringify(bounceHistory.slice(0, 100)));
      } catch (e) { /* silent */ }
    }, 2500);
  };

  // ─── VU Meter Component ────────────────────────────────────────────────────
  const renderVUMeter = () => (
    <View style={styles.vuContainer}>
      <Text style={styles.vuLabel}>VU</Text>
      <View style={styles.vuMeter}>
        <View style={styles.vuTrack}>
          <View style={[styles.vuFill, { width: `${vuLevel}%` }, vuLevel > 85 && styles.vuHot]} />
        </View>
        <View style={styles.vuScale}>
          <Text style={styles.vuScaleText}>-20</Text>
          <Text style={styles.vuScaleText}>-10</Text>
          <Text style={styles.vuScaleText}>-5</Text>
          <Text style={styles.vuScaleText}>0</Text>
          <Text style={[styles.vuScaleText, { color: Colors.accent }]}>+3</Text>
        </View>
      </View>
    </View>
  );

  // ─── Render Mode Select ────────────────────────────────────────────────────
  const renderModeSelect = () => (
    <View style={styles.modeSelectContainer}>
      <View style={styles.cloudwavePrompt}>
        <View style={styles.cloudwaveAvatar}>
          <Ionicons name="radio" size={18} color={Colors.secondary} />
        </View>
        <View style={styles.cloudwaveBubble}>
          <Text style={styles.cloudwaveText}>
            How would you like to record today?
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.modeOption, recordingMode === "full" && styles.modeOptionActive]}
        onPress={() => { setRecordingMode("full"); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        activeOpacity={0.7}
      >
        <Ionicons name="musical-notes" size={20} color={recordingMode === "full" ? "#fff" : Colors.secondary} />
        <View style={styles.modeOptionText}>
          <Text style={[styles.modeTitle, recordingMode === "full" && styles.modeTitleActive]}>Whole Song</Text>
          <Text style={styles.modeSub}>Record straight through, no stops</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modeOption, recordingMode === "punch-in" && styles.modeOptionActive]}
        onPress={() => { setRecordingMode("punch-in"); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        activeOpacity={0.7}
      >
        <Ionicons name="cut" size={20} color={recordingMode === "punch-in" ? "#fff" : Colors.secondary} />
        <View style={styles.modeOptionText}>
          <Text style={[styles.modeTitle, recordingMode === "punch-in" && styles.modeTitleActive]}>Punch In</Text>
          <Text style={styles.modeSub}>Record section by section, scroll & re-record</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modeOption, recordingMode === "word-by-word" && styles.modeOptionActive]}
        onPress={() => { setRecordingMode("word-by-word"); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        activeOpacity={0.7}
      >
        <Ionicons name="text" size={20} color={recordingMode === "word-by-word" ? "#fff" : Colors.secondary} />
        <View style={styles.modeOptionText}>
          <Text style={[styles.modeTitle, recordingMode === "word-by-word" && styles.modeTitleActive]}>Word by Word</Text>
          <Text style={styles.modeSub}>Take your time, one phrase at a time</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // ─── Render Mixing Animation ───────────────────────────────────────────────
  const renderMixing = () => (
    <View style={styles.mixingContainer}>
      {/* WavyEq Engineer */}
      <View style={styles.engineerSection}>
        <View style={styles.engineerAvatar}>
          <Ionicons name="headset" size={32} color={Colors.gold} />
        </View>
        <Text style={styles.engineerName}>WavyEq</Text>
        <Text style={styles.engineerStatus}>Mixing your track...</Text>
      </View>

      {/* Mixing Board Visualization */}
      <View style={styles.mixingBoard}>
        {[...Array(8)].map((_, i) => (
          <View key={i} style={styles.faderChannel}>
            <View style={styles.faderTrack}>
              <Animated.View
                style={[
                  styles.faderFill,
                  { height: `${30 + Math.random() * 60}%` },
                  i % 2 === 0 ? { backgroundColor: Colors.secondary } : { backgroundColor: Colors.gold },
                ]}
              />
            </View>
            <View style={[styles.faderKnob, { bottom: `${20 + Math.random() * 50}%` }]} />
          </View>
        ))}
      </View>

      {/* Progress */}
      <View style={styles.mixProgressContainer}>
        <View style={styles.mixProgressTrack}>
          <View style={[styles.mixProgressFill, { width: `${mixingProgress}%` }]} />
        </View>
        <Text style={styles.mixProgressText}>{mixingProgress}% — Applying AI polish</Text>
      </View>

      <View style={styles.mixSteps}>
        <Text style={[styles.mixStep, mixingProgress > 20 && styles.mixStepDone]}>
          {mixingProgress > 20 ? "✓" : "○"} Noise reduction
        </Text>
        <Text style={[styles.mixStep, mixingProgress > 40 && styles.mixStepDone]}>
          {mixingProgress > 40 ? "✓" : "○"} Pitch correction
        </Text>
        <Text style={[styles.mixStep, mixingProgress > 60 && styles.mixStepDone]}>
          {mixingProgress > 60 ? "✓" : "○"} EQ & compression
        </Text>
        <Text style={[styles.mixStep, mixingProgress > 80 && styles.mixStepDone]}>
          {mixingProgress > 80 ? "✓" : "○"} Reverb & mastering
        </Text>
      </View>
    </View>
  );

  // ─── Render Done ───────────────────────────────────────────────────────────
  const renderDone = () => (
    <View style={styles.doneContainer}>
      <View style={styles.doneIcon}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
      </View>
      <Text style={styles.doneTitle}>Track Ready!</Text>
      <Text style={styles.doneSub}>WavyEq finished mixing your recording</Text>
      <View style={styles.doneActions}>
        <TouchableOpacity style={styles.playbackBtn} onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} activeOpacity={0.7}>
          <Ionicons name="play" size={20} color="#fff" />
          <Text style={styles.playbackText}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.playbackBtn, { backgroundColor: "rgba(0,255,136,0.15)", borderWidth: 1, borderColor: Colors.success }]}
          onPress={() => setShowBounceModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="download" size={20} color={Colors.success} />
          <Text style={[styles.playbackText, { color: Colors.success }]}>Bounce MP3</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={async () => {
          await saveSubmission({
            assignmentTitle: songTitle,
            mode: recordingMode as "full" | "punch-in" | "word-by-word",
            duration: recordingTime,
            sectionsRecorded: sections.filter(s => s.recorded).length,
            totalSections: sections.length,
            score: 70 + Math.floor(Math.random() * 25),
          });
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        }} activeOpacity={0.7}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveText}>Save & Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Bounce/Export Modal */}
      <Modal visible={showBounceModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" }}>
          <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.textPrimary }}>Bounce to File</Text>
              <TouchableOpacity onPress={() => { setShowBounceModal(false); setBounceComplete(false); }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {!isBouncing && !bounceComplete ? (
              <>
                {/* Song Info */}
                <View style={{ alignItems: "center", padding: 16, backgroundColor: Colors.surfaceCard, borderRadius: 16, marginBottom: 16 }}>
                  <Ionicons name="musical-note" size={32} color={Colors.success} />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.textPrimary, marginTop: 8 }}>{songTitle}</Text>
                  <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>
                    {recordingMode} recording • {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                  </Text>
                </View>

                {/* Format Picker */}
                <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.textSecondary, marginBottom: 8 }}>Export Format</Text>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                  {(["mp3", "wav", "m4a"] as const).map((fmt) => (
                    <TouchableOpacity
                      key={fmt}
                      onPress={() => setBounceFormat(fmt)}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: "center",
                        backgroundColor: bounceFormat === fmt ? "rgba(0,255,136,0.12)" : Colors.surfaceCard,
                        borderWidth: 1.5,
                        borderColor: bounceFormat === fmt ? Colors.success : Colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "700", color: bounceFormat === fmt ? Colors.success : Colors.textPrimary }}>
                        .{fmt.toUpperCase()}
                      </Text>
                      <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 2 }}>
                        {fmt === "mp3" ? "320kbps" : fmt === "wav" ? "Lossless" : "AAC"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Bounce Button */}
                <TouchableOpacity
                  onPress={handleBounce}
                  style={{ backgroundColor: Colors.success, paddingVertical: 16, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="download" size={20} color="#000" />
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#000" }}>Bounce .{bounceFormat.toUpperCase()}</Text>
                </TouchableOpacity>
              </>
            ) : isBouncing ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <ActivityIndicator size="large" color={Colors.success} />
                <Text style={{ fontSize: 18, fontWeight: "600", color: Colors.textPrimary, marginTop: 16 }}>Bouncing to .{bounceFormat.toUpperCase()}...</Text>
                <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>Mixing vocals + instrumental</Text>
                <View style={{ width: "100%", height: 6, backgroundColor: Colors.surfaceCard, borderRadius: 3, marginTop: 20 }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: Colors.success, width: `${bounceProgress}%` }} />
                </View>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 8 }}>{bounceProgress}%</Text>
              </View>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(0,255,136,0.15)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "600", color: Colors.textPrimary, marginTop: 12 }}>Bounce Complete!</Text>
                <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>{songTitle}.{bounceFormat}</Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>Saved to your device</Text>

                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await Share.share({ message: `Check out my recording of "${songTitle}" — mixed in WavyEq Studios on LinguaVibe` });
                    } catch (e) { /* cancelled */ }
                  }}
                  style={{ backgroundColor: Colors.accent, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14, marginTop: 20, flexDirection: "row", alignItems: "center", gap: 8 }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share" size={18} color="#fff" />
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Share File</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setShowBounceModal(false); setBounceComplete(false); }}
                  style={{ marginTop: 12, paddingVertical: 10 }}
                >
                  <Text style={{ fontSize: 14, color: Colors.textSecondary }}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );


  // Load persisted data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@wavy_eq_studio_data');
        if (stored) {
          // Data available from sync/server
        }
      } catch {}
    })();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.studioName}>WavyEq Studios</Text>
          <Text style={styles.songInfo}>{songTitle}</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {studioState === "mixing" ? renderMixing() : studioState === "done" ? renderDone() : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Studio Ambiance - Mic Visual */}
          <View style={styles.studioVisual}>
            {/* Neon glow ring behind mic */}
            <Animated.View style={[styles.glowRing, { opacity: glowAnim }]} />
            <Animated.View style={[styles.glowRingInner, { opacity: glowAnim }]} />

            {/* Large Mic */}
            <Animated.View style={[styles.micContainer, { transform: [{ scale: studioState === "recording" ? pulseAnim : 1 }] }]}>
              <View style={styles.micBody}>
                <View style={styles.micHead}>
                  <Ionicons name="mic" size={48} color={Colors.textPrimary} />
                </View>
                <View style={styles.micStand} />
                <View style={styles.micMount} />
              </View>
            </Animated.View>

            {/* Recording indicator */}
            {studioState === "recording" && (
              <View style={styles.recIndicator}>
                <View style={styles.recDot} />
                <Text style={styles.recText}>REC</Text>
              </View>
            )}

            {/* Timer */}
            <Text style={styles.timer}>{formatTime(recordingTime)}</Text>
          </View>

          {/* WavyEq Engineer (background) */}
          <View style={styles.engineerBar}>
            <View style={styles.engineerMini}>
              <Ionicons name="headset" size={16} color={Colors.gold} />
            </View>
            <Text style={styles.engineerBarText}>
              {studioState === "recording" ? "WavyEq is monitoring levels..." : studioState === "paused" ? "Ready when you are..." : "WavyEq standing by"}
            </Text>
            <View style={[styles.engineerStatus2, studioState === "recording" && { backgroundColor: Colors.success + "30", borderColor: Colors.success + "50" }]}>
              <View style={[styles.statusDot, studioState === "recording" && { backgroundColor: Colors.success }]} />
            </View>
          </View>

          {/* Punch-in Section Selector */}
          {(recordingMode === "punch-in" || recordingMode === "word-by-word") && !showModeSelect && (
            <View style={styles.sectionSelector}>
              <TouchableOpacity onPress={handlePrevSection} style={styles.sectionNav} disabled={currentSectionIdx === 0}>
                <Ionicons name="chevron-back" size={20} color={currentSectionIdx === 0 ? Colors.textMuted : Colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionNum}>Section {currentSectionIdx + 1}/{sections.length}</Text>
                <Text style={styles.sectionText}>{sections[currentSectionIdx].text}</Text>
                {sections[currentSectionIdx].recorded && (
                  <View style={styles.recordedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                    <Text style={styles.recordedText}>Recorded</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={handleNextSection} style={styles.sectionNav} disabled={currentSectionIdx === sections.length - 1}>
                <Ionicons name="chevron-forward" size={20} color={currentSectionIdx === sections.length - 1 ? Colors.textMuted : Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Mode Selection */}
          {showModeSelect && renderModeSelect()}

          {/* VU Meter */}
          {!showModeSelect && renderVUMeter()}

          {/* Gain Control */}
          {!showModeSelect && (
            <View style={styles.gainContainer}>
              <View style={styles.gainRow}>
                <Text style={styles.gainLabel}>GAIN</Text>
                <View style={styles.gainSlider}>
                  <View style={styles.gainTrack}>
                    <View style={[styles.gainFill, { width: `${gain}%` }]} />
                  </View>
                </View>
                <Text style={styles.gainValue}>{gain}%</Text>
              </View>
              <View style={styles.monitorRow}>
                <Text style={styles.monitorLabel}>MONITOR</Text>
                <TouchableOpacity
                  style={[styles.monitorToggle, monitorOn && styles.monitorToggleOn]}
                  onPress={() => { setMonitorOn(!monitorOn); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.monitorToggleText, monitorOn && styles.monitorToggleTextOn]}>
                    {monitorOn ? "ON" : "OFF"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Bottom Controls */}
      {studioState !== "mixing" && studioState !== "done" && (
        <View style={styles.controls}>
          {/* Stop */}
          <TouchableOpacity
            style={[styles.controlBtn, styles.stopBtn]}
            onPress={handleStop}
            disabled={studioState === "idle" && recordingTime === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="stop" size={24} color={studioState === "idle" && recordingTime === 0 ? Colors.textMuted : Colors.textPrimary} />
          </TouchableOpacity>

          {/* Record */}
          <TouchableOpacity
            style={[styles.controlBtn, styles.recordBtn, studioState === "recording" && styles.recordBtnActive]}
            onPress={handleRecord}
            activeOpacity={0.7}
          >
            <Ionicons
              name={studioState === "recording" ? "pause" : "mic"}
              size={32}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Finish/Send to WavyEq */}
          <TouchableOpacity
            style={[styles.controlBtn, styles.finishBtn, (studioState === "idle" && recordingTime === 0) && { opacity: 0.4 }]}
            onPress={handleFinish}
            disabled={studioState === "idle" && recordingTime === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark" size={24} color={Colors.gold} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  studioName: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.gold,
    letterSpacing: 1,
  },
  songInfo: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },

  // Studio Visual (Mic area)
  studioVisual: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: Colors.glow,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  glowRingInner: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: "rgba(170, 0, 255, 0.4)",
    shadowColor: "rgba(170, 0, 255, 0.6)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  micContainer: {
    alignItems: "center",
  },
  micBody: {
    alignItems: "center",
  },
  micHead: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.glowBorder,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  micStand: {
    width: 4,
    height: 40,
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
  },
  micMount: {
    width: 30,
    height: 6,
    backgroundColor: Colors.textMuted,
    borderRadius: 3,
  },
  recIndicator: {
    position: "absolute",
    top: 20,
    right: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accent + "30",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accent + "60",
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  recText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.accent,
    letterSpacing: 1,
  },
  timer: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
    marginTop: 16,
  },

  // Engineer Bar
  engineerBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    gap: 10,
  },
  engineerMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.goldGlow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  engineerBarText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  engineerStatus2: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },

  // Section Selector (Punch-in)
  sectionSelector: {
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
  sectionNav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionInfo: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  sectionNum: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  sectionText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  recordedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    backgroundColor: Colors.greenGlow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  recordedText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.success,
  },

  // Mode Select
  modeSelectContainer: {
    marginHorizontal: Spacing.lg,
    gap: 10,
  },
  cloudwavePrompt: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  cloudwaveAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  cloudwaveBubble: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  cloudwaveText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeOptionActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.glow,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  modeOptionText: {
    flex: 1,
  },
  modeTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  modeTitleActive: {
    color: "#FFFFFF",
  },
  modeSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // VU Meter
  vuContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vuLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
  },
  vuMeter: {
    gap: 6,
  },
  vuTrack: {
    height: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 6,
    overflow: "hidden",
  },
  vuFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 6,
  },
  vuHot: {
    backgroundColor: Colors.accent,
  },
  vuScale: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  vuScaleText: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: "600",
  },

  // Gain
  gainContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  gainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gainLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 1,
    width: 40,
  },
  gainSlider: {
    flex: 1,
  },
  gainTrack: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden",
  },
  gainFill: {
    height: "100%",
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
  gainValue: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gold,
    width: 36,
    textAlign: "right",
  },
  monitorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  monitorLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 1,
    flex: 1,
  },
  monitorToggle: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monitorToggleOn: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.glow,
  },
  monitorToggleText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  monitorToggleTextOn: {
    color: "#FFFFFF",
  },

  // Bottom Controls
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: Colors.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  controlBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  stopBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 3,
    borderColor: "rgba(255, 45, 45, 0.5)",
  },
  recordBtnActive: {
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    borderColor: Colors.goldBorder,
  },
  finishBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },

  // Mixing
  mixingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    gap: 24,
  },
  engineerSection: {
    alignItems: "center",
    gap: 8,
  },
  engineerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.goldGlow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.goldBorder,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  engineerName: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.gold,
    letterSpacing: 1,
  },
  engineerStatus: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  mixingBoard: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 100,
    paddingHorizontal: Spacing.lg,
  },
  faderChannel: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    position: "relative",
  },
  faderTrack: {
    width: 6,
    height: "100%",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  faderFill: {
    width: "100%",
    borderRadius: 3,
  },
  faderKnob: {
    position: "absolute",
    width: 14,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textPrimary,
  },
  mixProgressContainer: {
    width: "100%",
    gap: 8,
  },
  mixProgressTrack: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden",
  },
  mixProgressFill: {
    height: "100%",
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
  mixProgressText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  mixSteps: {
    gap: 6,
    alignSelf: "flex-start",
  },
  mixStep: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  mixStepDone: {
    color: Colors.success,
  },

  // Done
  doneContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: Spacing.lg,
  },
  doneIcon: {
    marginBottom: 8,
  },
  doneTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  doneSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  doneActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  playbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
  },
  playbackText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
  },
  saveText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textDark,
  },
});
