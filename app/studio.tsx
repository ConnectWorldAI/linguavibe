import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useAudioRecorder, RecordingOptions, AudioModule } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";


const { width } = Dimensions.get("window");

type RecordingState = "idle" | "countdown" | "recording" | "review";

export default function StudioScreen() {
  const [state, setState] = useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [dbLevel, setDbLevel] = useState(-24);
  const [autoTuneAmount, setAutoTuneAmount] = useState(0.3); // 0 = natural, 1 = heavy
  const [reverbAmount, setReverbAmount] = useState(0.5);
  const [eqPreset, setEqPreset] = useState("Warm");
  const [compressorOn, setCompressorOn] = useState(true);
  const [showProcessed, setShowProcessed] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Simulated waveform animation
  useEffect(() => {
    if (state === "recording") {
      const interval = setInterval(() => {
        setRecordingTime((t) => t + 1);
        setDbLevel(-24 + Math.random() * 30);
      }, 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      return () => clearInterval(interval);
    }
  }, [state]);

  // Countdown logic
  useEffect(() => {
    if (state === "countdown") {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setState("recording");
        setCountdown(3);
      }
    }
  }, [state, countdown]);

  // Pulse animation for record button
  useEffect(() => {
    if (state === "recording") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  const audioRecorder = useAudioRecorder({
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  } as any);

  const startRecording = async () => {
    setState("countdown");
    setRecordingTime(0);
    setDbLevel(-24);
    try {
      if (Platform.OS !== 'web') {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) return;
      }
    } catch {}
  };

  // When countdown finishes and state becomes 'recording', start the actual recorder
  useEffect(() => {
    if (state === 'recording') {
      try {
        audioRecorder.record();
      } catch {}
    }
  }, [state]);

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      // Save the recording URI for later use
      const uri = audioRecorder.uri;
      if (uri) {
        const recordings = JSON.parse(await AsyncStorage.getItem('@studio_recordings') || '[]');
        recordings.push({ uri, duration: recordingTime, createdAt: Date.now() });
        await AsyncStorage.setItem('@studio_recordings', JSON.stringify(recordings));
      }
    } catch {}
    setState("review");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getDbColor = () => {
    if (dbLevel > 0) return Colors.error;
    if (dbLevel > -6) return Colors.warning;
    return Colors.success;
  };

  const getDbLabel = () => {
    if (dbLevel > 0) return "TOO HOT!";
    if (dbLevel > -6) return "LOUD";
    return "GOOD";
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>WavyEq Studio</Text>
          <Text style={styles.headerSub}>Sing over your translated song</Text>
        </View>
        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="help-circle-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Song Info Bar */}
        <View style={styles.songBar}>
          <View style={styles.songBarIcon}>
            <Ionicons name="musical-note" size={16} color={Colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.songBarTitle} numberOfLines={1}>Despacito (English Translation)</Text>
            <Text style={styles.songBarArtist}>Luis Fonsi • Spanish → English</Text>
          </View>
          <TouchableOpacity style={styles.songBarPlay}>
            <Ionicons name="play" size={14} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Countdown Overlay */}
        {state === "countdown" && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.countdownLabel}>Get ready...</Text>
          </View>
        )}

        {/* Waveform Display */}
        <View style={styles.waveformContainer}>
          <View style={styles.waveformBg}>
            {/* Simulated waveform bars */}
            <View style={styles.waveformBars}>
              {Array.from({ length: 40 }).map((_, i) => {
                const height = state === "recording"
                  ? 8 + Math.random() * 52
                  : state === "review"
                    ? 8 + Math.sin(i * 0.3) * 25 + 20
                    : 8;
                return (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height,
                        backgroundColor: state === "recording"
                          ? dbLevel > 0 ? Colors.error : Colors.secondary
                          : state === "review"
                            ? Colors.gold  // Gold waveform accent (logo-inspired)
                            : Colors.glowBorder,
                      },
                    ]}
                  />
                );
              })}
            </View>
            {/* Time display */}
            <View style={styles.timeDisplay}>
              <Text style={styles.timeText}>{formatTime(recordingTime)}</Text>
            </View>
          </View>
        </View>

        {/* dB Meter */}
        <View style={styles.dbMeter}>
          <Text style={styles.dbLabel}>LEVEL</Text>
          <View style={styles.dbBarContainer}>
            <View style={styles.dbBarBg}>
              <View
                style={[
                  styles.dbBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, ((dbLevel + 40) / 40) * 100))}%`,
                    backgroundColor: getDbColor(),
                  },
                ]}
              />
              {/* Red zone indicator */}
              <View style={styles.dbRedZone} />
            </View>
            <View style={styles.dbNumbers}>
              <Text style={styles.dbNum}>-40</Text>
              <Text style={styles.dbNum}>-20</Text>
              <Text style={styles.dbNum}>-6</Text>
              <Text style={[styles.dbNum, { color: Colors.error }]}>0</Text>
            </View>
          </View>
          <View style={styles.dbStatus}>
            <View style={[styles.dbStatusDot, { backgroundColor: getDbColor() }]} />
            <Text style={[styles.dbStatusText, { color: getDbColor() }]}>{getDbLabel()}</Text>
            <Text style={styles.dbValue}>{dbLevel.toFixed(0)} dB</Text>
          </View>
        </View>

        {/* Record Button */}
        <View style={styles.recordSection}>
          {state === "idle" && (
            <TouchableOpacity style={styles.recordBtn} onPress={startRecording} activeOpacity={0.8}>
              <View style={styles.recordBtnInner}>
                <Ionicons name="mic" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.recordLabel}>Tap to Record</Text>
            </TouchableOpacity>
          )}
          {state === "recording" && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={styles.stopBtn} onPress={stopRecording} activeOpacity={0.8}>
                <View style={styles.stopBtnInner}>
                  <Ionicons name="stop" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.recordLabel}>Recording...</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          {state === "review" && (
            <View style={styles.reviewActions}>
              <TouchableOpacity style={styles.reviewBtn} onPress={() => setState("idle")}>
                <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
                <Text style={styles.reviewBtnText}>Re-record</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reviewBtnPrimary}>
                <Ionicons name="play" size={20} color={Colors.textPrimary} />
                <Text style={styles.reviewBtnText}>Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reviewBtnGold}>
                <Ionicons name="checkmark" size={20} color={Colors.textDark} />
                <Text style={[styles.reviewBtnText, { color: Colors.textDark }]}>Keep</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Processing Controls */}
        <View style={styles.controlsSection}>
          <Text style={styles.controlsTitle}>VOCAL PROCESSING</Text>

          {/* Before/After Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, showProcessed && styles.toggleBtnActive]}
              onPress={() => setShowProcessed(true)}
            >
              <Ionicons name="sparkles" size={14} color={showProcessed ? Colors.textPrimary : Colors.textSecondary} />
              <Text style={[styles.toggleText, showProcessed && styles.toggleTextActive]}>Processed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !showProcessed && styles.toggleBtnActive]}
              onPress={() => setShowProcessed(false)}
            >
              <Ionicons name="mic-outline" size={14} color={!showProcessed ? Colors.textPrimary : Colors.textSecondary} />
              <Text style={[styles.toggleText, !showProcessed && styles.toggleTextActive]}>Raw</Text>
            </TouchableOpacity>
          </View>

          {/* Auto-Tune Slider */}
          <View style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <View style={styles.controlIcon}>
                <Ionicons name="musical-notes" size={16} color={Colors.secondary} />
              </View>
              <Text style={styles.controlName}>Auto-Tune</Text>
              <Text style={styles.controlValue}>
                {autoTuneAmount < 0.3 ? "Natural" : autoTuneAmount < 0.7 ? "Subtle" : "Heavy"}
              </Text>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Natural</Text>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${autoTuneAmount * 100}%` }]} />
                <View style={[styles.sliderThumb, { left: `${autoTuneAmount * 100}%` }]} />
              </View>
              <Text style={styles.sliderLabel}>Heavy</Text>
            </View>
            <Text style={styles.controlHint}>Corrects pitch to match the song's key</Text>
          </View>

          {/* Reverb Control */}
          <View style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <View style={[styles.controlIcon, { backgroundColor: "rgba(139, 92, 246, 0.15)", borderColor: "rgba(139, 92, 246, 0.4)" }]}>
                <Ionicons name="water" size={16} color="#8B5CF6" />
              </View>
              <Text style={styles.controlName}>Reverb</Text>
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>Matches Song</Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Dry</Text>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${reverbAmount * 100}%`, backgroundColor: "#8B5CF6" }]} />
                <View style={[styles.sliderThumb, { left: `${reverbAmount * 100}%`, backgroundColor: "#8B5CF6" }]} />
              </View>
              <Text style={styles.sliderLabel}>Wet</Text>
            </View>
            <Text style={styles.controlHint}>Automatically matches the original song's reverb settings</Text>
          </View>

          {/* EQ Preset */}
          <View style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <View style={[styles.controlIcon, { backgroundColor: Colors.greenGlow, borderColor: Colors.greenBorder }]}>
                <Ionicons name="options" size={16} color={Colors.success} />
              </View>
              <Text style={styles.controlName}>EQ</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {["Flat", "Warm", "Bright", "Deep", "Air"].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetChip, eqPreset === preset && styles.presetChipActive]}
                  onPress={() => setEqPreset(preset)}
                >
                  <Text style={[styles.presetText, eqPreset === preset && styles.presetTextActive]}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.controlHint}>Shapes your vocal tone to blend with the track</Text>
          </View>

          {/* Compressor Toggle */}
          <View style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <View style={[styles.controlIcon, { backgroundColor: Colors.goldGlow, borderColor: Colors.goldBorder }]}>
                <Ionicons name="pulse" size={16} color={Colors.gold} />
              </View>
              <Text style={styles.controlName}>Compressor</Text>
              <TouchableOpacity
                style={[styles.compToggle, compressorOn && styles.compToggleOn]}
                onPress={() => setCompressorOn(!compressorOn)}
              >
                <View style={[styles.compToggleDot, compressorOn && styles.compToggleDotOn]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.controlHint}>Evens out loud and quiet parts for a polished sound</Text>
          </View>
        </View>

        {/* Export Section */}
        <View style={styles.exportSection}>
          <TouchableOpacity style={styles.exportBtn} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.exportBtnText}>Export & Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8}>
            <Ionicons name="save-outline" size={18} color={Colors.secondary} />
            <Text style={styles.saveBtnText}>Save to Library</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingVertical: Spacing.md,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  helpBtn: {
    padding: 4,
  },

  // Song info bar
  songBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  songBarIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  songBarTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  songBarArtist: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  songBarPlay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Countdown
  countdownOverlay: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: "900",
    color: Colors.secondary,
    textShadowColor: Colors.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  countdownLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },

  // Waveform
  waveformContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  waveformBg: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
    justifyContent: "center",
  },
  waveformBars: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    gap: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    minHeight: 4,
  },
  timeDisplay: {
    alignItems: "center",
    marginTop: Spacing.md,
  },
  timeText: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },

  // dB Meter
  dbMeter: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dbLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  dbBarContainer: {},
  dbBarBg: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  dbBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  dbRedZone: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "15%",
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  dbNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  dbNum: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  dbStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: 6,
  },
  dbStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dbStatusText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
  },
  dbValue: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginLeft: "auto",
  },

  // Record button
  recordSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  recordBtn: {
    alignItems: "center",
    gap: 12,
  },
  recordBtnInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 3,
    borderColor: "rgba(255, 45, 45, 0.4)",
  },
  recordLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  stopBtn: {
    alignItems: "center",
    gap: 12,
  },
  stopBtnInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 3,
    borderColor: "rgba(255, 45, 45, 0.6)",
  },
  reviewActions: {
    flexDirection: "row",
    gap: 12,
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
  },
  reviewBtnGold: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
  },
  reviewBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  // Controls
  controlsSection: {
    marginHorizontal: Spacing.lg,
  },
  controlsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textAccent,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.full,
    padding: 3,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: Colors.secondary,
  },
  toggleText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.textPrimary,
  },

  // Control cards
  controlCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  controlHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Spacing.md,
  },
  controlIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  controlName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  controlValue: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "600",
  },
  controlHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },

  // Slider
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sliderLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    width: 40,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    position: "relative",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: Colors.textPrimary,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  // Match badge
  matchBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8B5CF6",
  },

  // EQ Presets
  presetScroll: {
    marginBottom: 4,
  },
  presetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  presetText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  presetTextActive: {
    color: Colors.textDark,
  },

  // Compressor toggle
  compToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 2,
    justifyContent: "center",
  },
  compToggleOn: {
    backgroundColor: Colors.gold,
  },
  compToggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textSecondary,
  },
  compToggleDotOn: {
    backgroundColor: Colors.textDark,
    alignSelf: "flex-end",
  },

  // Export
  exportSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    gap: 12,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: 8,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  exportBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceCard,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  saveBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
});
