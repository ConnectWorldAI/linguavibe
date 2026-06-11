import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  Platform,
  Modal,
  Switch,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { useSubscription } from "@/hooks/use-subscription";
import { getDemoSong } from "@/lib/demo-songs";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────────────────────────
type ViewMode = "mixer" | "chords" | "lyrics";
type SeparationQuality = "4-track" | "8-track" | "16-track-hifi";

interface Stem {
  id: string;
  name: string;
  icon: string;
  color: string;
  volume: number;
  isMuted: boolean;
  isLocked: boolean;
  number?: number;
}

interface ChordBar {
  measure: number;
  beats: (string | null)[];
}

interface LyricLine {
  measure: number;
  text: string;
  startTime: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const STEMS_4: Stem[] = [
  { id: "v1", name: "Vocals 1", icon: "mic", color: "#00E5CC", volume: 0.7, isMuted: false, isLocked: false, number: 1 },
  { id: "v2", name: "Vocals 2", icon: "mic-outline", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true, number: 2 },
  { id: "bass", name: "Bass", icon: "musical-note", color: "#00E5CC", volume: 0.65, isMuted: false, isLocked: false },
  { id: "drums", name: "Drums", icon: "disc", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
];

const STEMS_8: Stem[] = [
  { id: "v1", name: "Vocals 1", icon: "mic", color: "#00E5CC", volume: 0.7, isMuted: false, isLocked: false, number: 1 },
  { id: "v2", name: "Vocals 2", icon: "mic-outline", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true, number: 2 },
  { id: "bass", name: "Bass", icon: "musical-note", color: "#00E5CC", volume: 0.65, isMuted: false, isLocked: false },
  { id: "drums", name: "Drums", icon: "disc", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
  { id: "keys", name: "Keys", icon: "grid-outline", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
  { id: "guitar", name: "Guitar", icon: "musical-notes", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
  { id: "brass", name: "Brass", icon: "megaphone-outline", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
  { id: "other", name: "Other", icon: "ellipsis-horizontal", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
];

const STEMS_16: Stem[] = [
  ...STEMS_8,
  { id: "synth", name: "Synth", icon: "pulse", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
  { id: "strings", name: "Strings", icon: "musical-notes-outline", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
  { id: "perc", name: "Percussion", icon: "radio-button-on", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
  { id: "fx", name: "FX", icon: "sparkles", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
  { id: "backing", name: "Backing Vox", icon: "people", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
  { id: "sub", name: "Sub Bass", icon: "pulse-outline", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
  { id: "hats", name: "Hi-Hats", icon: "triangle-outline", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
  { id: "ambient", name: "Ambient", icon: "cloudy", color: "#00E5CC", volume: 0.5, isMuted: true, isLocked: true },
];

const MOCK_CHORDS: ChordBar[] = [
  { measure: 1, beats: ["Fm7", null, null, null] },
  { measure: 2, beats: [null, null, "Fm7", null] },
  { measure: 3, beats: ["D/Gb", null, null, null] },
  { measure: 4, beats: ["G7", null, "Cm7", null] },
  { measure: 5, beats: ["Cm7", null, null, "Fm7"] },
  { measure: 6, beats: ["Fm7", null, "Fm7/Eb", "Eb"] },
  { measure: 7, beats: ["Eb", null, "Dm7", null] },
  { measure: 8, beats: ["Dm7", null, "Dm7b5", null] },
  { measure: 9, beats: ["G7", null, "Fm7", null] },
  { measure: 10, beats: ["Fm7", null, "Cm", null] },
  { measure: 11, beats: ["Cm", null, "Fm7", null] },
  { measure: 12, beats: ["Fm7", null, null, null] },
];

const MOCK_LYRICS: LyricLine[] = [
  { measure: 1, text: "", startTime: 0 },
  { measure: 2, text: "", startTime: 4 },
  { measure: 3, text: "", startTime: 8 },
  { measure: 4, text: "", startTime: 12 },
  { measure: 5, text: "", startTime: 16 },
  { measure: 6, text: "I said I'm in trouble,", startTime: 20 },
  { measure: 7, text: "(yeah, trouble)", startTime: 24 },
  { measure: 8, text: "", startTime: 28 },
  { measure: 9, text: "Yeah, New Orleans, baby,", startTime: 32 },
  { measure: 10, text: "a street called Eagle · And everybody's ill,", startTime: 36 },
  { measure: 11, text: "yeah, illegal · People still cause,", startTime: 40 },
  { measure: 12, text: "trouble, yeah", startTime: 44 },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function StemSeparatorScreen() {
  const router = useRouter();
  const colors = useColors();
  const { plan } = useSubscription();
  const params = useLocalSearchParams<{ songTitle?: string; songArtist?: string; demoSongId?: string }>();

  const songTitle = params.songTitle || "Lil Wayne   Trouble";
  const songArtist = params.songArtist || "";

  // Load demo song lyrics if demoSongId is provided
  const demoSongData = params.demoSongId ? getDemoSong(params.demoSongId) : null;
  const initialLyrics = demoSongData ? demoSongData.stemLyrics : MOCK_LYRICS;

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("mixer");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(4); // seconds
  const [totalDuration] = useState(demoSongData ? 204 : 239);
  const [quality, setQuality] = useState<SeparationQuality>("16-track-hifi");
  const [stems, setStems] = useState<Stem[]>(STEMS_8);
  const [showSettings, setShowSettings] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState(1);
  const [chords, setChords] = useState(MOCK_CHORDS);
  const [lyrics, setLyrics] = useState(initialLyrics);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // tRPC mutations for file upload and stem separation
  const uploadAudioMutation = trpc.songPipeline.uploadAudio.useMutation();
  const isolateVocalsMutation = trpc.songPipeline.isolateVocals.useMutation();

  // Pick and process an audio file
  const pickAndProcessAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/m4a", "audio/mp4", "audio/flac", "audio/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (asset.size && asset.size > 50 * 1024 * 1024) {
        Alert.alert("File Too Large", "Please select an audio file under 50MB.");
        return;
      }

      setUploadedFile(asset);
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStage("Uploading audio file...");

      // Read file as base64
      let base64Data: string;
      if (Platform.OS === "web" && asset.file) {
        const arrayBuffer = await asset.file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64Data = btoa(binary);
      } else {
        base64Data = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      setProcessingProgress(15);
      setProcessingStage("Uploading to server...");

      // Upload to server
      const uploadResult = await uploadAudioMutation.mutateAsync({
        base64Audio: base64Data,
        mimeType: asset.mimeType || "audio/mpeg",
        filename: asset.name || "song.mp3",
      });

      setProcessingProgress(30);
      setProcessingStage("Starting stem separation...");

      // Start stem separation
      const stemResult = await isolateVocalsMutation.mutateAsync({
        audioUrl: uploadResult.url,
        outputStems: ["vocals", "instrumental", "drums", "bass", "other"],
      });

      // Poll for completion (simulated progress)
      let progress = 30;
      const stages = [
        "Analyzing frequency spectrum...",
        "Isolating vocal frequencies...",
        "Separating drum patterns...",
        "Extracting bass frequencies...",
        "Refining stem boundaries...",
        "Normalizing output levels...",
        "Finalizing stems...",
      ];
      let stageIdx = 0;
      const interval = setInterval(() => {
        progress += 10;
        stageIdx = Math.min(Math.floor((progress - 30) / 10), stages.length - 1);
        setProcessingProgress(Math.min(progress, 100));
        setProcessingStage(stages[stageIdx]);
        if (progress >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          // Update stems with result data
          if (stemResult.stems) {
            const newStems: Stem[] = stemResult.stems.map((s: string, i: number) => ({
              id: s,
              name: s.charAt(0).toUpperCase() + s.slice(1),
              icon: s === "vocals" ? "mic" : s === "drums" ? "disc" : s === "bass" ? "musical-note" : s === "instrumental" ? "musical-notes" : "ellipsis-horizontal",
              color: "#00E5CC",
              volume: s === "vocals" ? 0.8 : 0.6,
              isMuted: false,
              isLocked: false,
            }));
            setStems(newStems);
          }
        }
      }, 3000);
    } catch (err: any) {
      console.error("Stem separation error:", err);
      setIsProcessing(false);
      Alert.alert("Error", "Could not process audio file. Please try again.");
    }
  };

  // Load song analysis data from AsyncStorage if available
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(`@stem_analysis_${songTitle}`);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.chords) setChords(data.chords);
          if (data.lyrics) setLyrics(data.lyrics);
        }
      } catch {}
    })();
  }, []);

  // Playback simulation
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      playbackRef.current = setInterval(() => {
        setCurrentTime((t) => {
          const next = t + 1;
          if (next >= totalDuration) {
            if (isRepeat) return 0;
            setIsPlaying(false);
            return totalDuration;
          }
          setCurrentMeasure(Math.floor(next / 4) + 1);
          return next;
        });
      }, 1000);
    } else if (playbackRef.current) {
      clearInterval(playbackRef.current);
    }
    return () => { if (playbackRef.current) clearInterval(playbackRef.current); };
  }, [isPlaying, isRepeat, totalDuration]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, totalDuration)));
    setCurrentMeasure(Math.floor(time / 4) + 1);
  };

  const toggleStemMute = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const stem = stems.find((s) => s.id === id);
    if (stem?.isLocked && plan === "free") {
      // Premium locked
      return;
    }
    setStems(stems.map((s) => s.id === id ? { ...s, isMuted: !s.isMuted } : s));
  };

  const updateVolume = (id: string, volume: number) => {
    const stem = stems.find((s) => s.id === id);
    if (stem?.isLocked && plan === "free") return;
    setStems(stems.map((s) => s.id === id ? { ...s, volume, isMuted: false } : s));
  };

  const handleQualityChange = (q: SeparationQuality) => {
    if (q === "16-track-hifi" && plan === "free") return;
    if (q === "8-track" && plan === "free") return;
    setQuality(q);
    if (q === "4-track") setStems(STEMS_4);
    else if (q === "8-track") setStems(STEMS_8);
    else setStems(STEMS_16);
    setShowSettings(false);
  };

  // ─── Chord Bar (top) ─────────────────────────────────────────────────────
  const renderChordBar = () => {
    const visibleChords = chords.filter(
      (c) => c.measure >= currentMeasure && c.measure < currentMeasure + 3
    );
    return (
      <View style={styles.chordBar}>
        {visibleChords.map((bar) => (
          <View key={bar.measure} style={styles.chordBarMeasure}>
            {bar.beats.map((chord, i) => (
              <View
                key={`${bar.measure}-${i}`}
                style={[
                  styles.chordBeat,
                  {
                    backgroundColor:
                      bar.measure === currentMeasure && i === (currentTime % 4)
                        ? "#FFFFFF"
                        : chord
                        ? "#3A3A3A"
                        : "#2A2A2A",
                  },
                ]}
              >
                {chord && (
                  <Text
                    style={[
                      styles.chordText,
                      {
                        color:
                          bar.measure === currentMeasure && i === (currentTime % 4)
                            ? "#000000"
                            : "#CCCCCC",
                      },
                    ]}
                  >
                    {chord}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  // ─── Mixer View ──────────────────────────────────────────────────────────
  const renderMixerView = () => (
    <ScrollView style={styles.mixerScroll} showsVerticalScrollIndicator={false}>
      {stems.map((stem) => (
        <View key={stem.id} style={styles.stemRow}>
          {/* Icon */}
          <View style={styles.stemIconContainer}>
            <Ionicons
              name={stem.icon as any}
              size={20}
              color={stem.isMuted ? "#555" : "#AAA"}
            />
            {stem.number && (
              <View style={styles.stemNumber}>
                <Text style={styles.stemNumberText}>{stem.number}</Text>
              </View>
            )}
          </View>

          {/* Volume Slider */}
          <View style={styles.sliderContainer}>
            <View style={[styles.sliderTrack, { backgroundColor: "#333" }]}>
              <View
                style={[
                  styles.sliderFill,
                  {
                    width: `${stem.volume * 100}%`,
                    backgroundColor: stem.isMuted ? "#555" : stem.color,
                  },
                ]}
              />
              <View
                style={[
                  styles.sliderThumb,
                  {
                    left: `${stem.volume * 100}%`,
                    borderColor: stem.isMuted ? "#555" : stem.color,
                  },
                ]}
              />
            </View>
            {/* Tap zones for volume control */}
            <TouchableOpacity
              style={styles.sliderTouchArea}
              onPress={() => updateVolume(stem.id, Math.max(0, stem.volume - 0.1))}
              activeOpacity={0.7}
            />
          </View>

          {/* Lock / Menu */}
          {stem.isLocked && plan === "free" ? (
            <TouchableOpacity
              style={styles.stemAction}
              onPress={() => router.push("/membership" as any)}
            >
              <Ionicons name="lock-closed" size={18} color="#555" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stemAction}
              onPress={() => toggleStemMute(stem.id)}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color="#777" />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );

  // ─── Chord Grid View ─────────────────────────────────────────────────────
  const renderChordGridView = () => (
    <ScrollView style={styles.chordGridScroll} showsVerticalScrollIndicator={false}>
      {chords.map((bar) => (
        <View key={bar.measure}>
          <Text style={styles.measureNumber}>{bar.measure}</Text>
          <View style={styles.chordGridRow}>
            {bar.beats.map((chord, i) => (
              <View
                key={`${bar.measure}-${i}`}
                style={[
                  styles.chordGridCell,
                  {
                    backgroundColor:
                      bar.measure === currentMeasure && i === (currentTime % 4)
                        ? "#FFFFFF"
                        : chord
                        ? "#3A3A3A"
                        : "#2A2A2A",
                  },
                ]}
              >
                {chord && (
                  <Text
                    style={[
                      styles.chordGridText,
                      {
                        color:
                          bar.measure === currentMeasure && i === (currentTime % 4)
                            ? "#000000"
                            : "#CCCCCC",
                      },
                    ]}
                  >
                    {chord}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // ─── Lyrics View ─────────────────────────────────────────────────────────
  const renderLyricsView = () => (
    <ScrollView style={styles.lyricsScroll} showsVerticalScrollIndicator={false}>
      {lyrics.map((line, idx) => {
        const chord = chords.find((c) => c.measure === line.measure);
        const isActive = line.measure === currentMeasure;
        return (
          <View key={idx} style={styles.lyricBlock}>
            {/* Chord bar above lyrics */}
            {chord && (
              <View style={styles.lyricChordRow}>
                {chord.beats.map((c, i) => (
                  <View
                    key={i}
                    style={[
                      styles.lyricChordCell,
                      {
                        backgroundColor:
                          isActive && i === (currentTime % 4)
                            ? "#FFFFFF"
                            : c
                            ? "#3A3A3A"
                            : "#2A2A2A",
                      },
                    ]}
                  >
                    {c && (
                      <Text
                        style={[
                          styles.lyricChordText,
                          {
                            color:
                              isActive && i === (currentTime % 4)
                                ? "#000000"
                                : "#CCCCCC",
                          },
                        ]}
                      >
                        {c}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
            {/* Lyrics text */}
            {line.text ? (
              <Text
                style={[
                  styles.lyricText,
                  { color: isActive ? "#FFFFFF" : "#888888" },
                ]}
              >
                {line.text}
              </Text>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );

  // ─── Playback Controls ───────────────────────────────────────────────────
  const renderPlaybackControls = () => (
    <View style={styles.playbackSection}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: "#333" }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(currentTime / totalDuration) * 100}%`,
                backgroundColor: "#FFFFFF",
              },
            ]}
          />
          <View
            style={[
              styles.progressThumb,
              { left: `${(currentTime / totalDuration) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.timeLabels}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>-{formatTime(totalDuration - currentTime)}</Text>
        </View>
      </View>

      {/* Controls row */}
      <View style={styles.controlsRow}>
        {/* Metronome */}
        <TouchableOpacity style={styles.controlBtn}>
          <Ionicons name="timer-outline" size={22} color="#AAA" />
        </TouchableOpacity>

        {/* Rewind */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => seekTo(Math.max(0, currentTime - 10))}
        >
          <Ionicons name="play-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={30}
            color="#000000"
          />
        </TouchableOpacity>

        {/* Forward */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => seekTo(Math.min(totalDuration, currentTime + 10))}
        >
          <Ionicons name="play-forward" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Key change */}
        <TouchableOpacity style={styles.controlBtn}>
          <Text style={styles.keyChangeText}>b#</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Bottom Tabs ─────────────────────────────────────────────────────────
  const handleStartLesson = () => {
    const lyricsText = lyrics.map(l => l.text).filter(Boolean).join('\n');
    if (!lyricsText.trim()) {
      Alert.alert('No Lyrics', 'Lyrics are needed to generate a lesson breakdown. Switch to the Lyrics view first.');
      return;
    }
    router.push({
      pathname: '/song-lesson-breakdown',
      params: {
        title: params.songTitle || 'Unknown Song',
        artist: params.songArtist || 'Unknown Artist',
        lyrics: lyricsText,
        sourceLanguage: 'Spanish',
        targetLanguage: 'English',
      },
    } as any);
  };

  const renderBottomTabs = () => (
    <View style={styles.bottomTabs}>
      <TouchableOpacity
        style={[styles.bottomTab, viewMode === "lyrics" && styles.bottomTabActive]}
        onPress={() => setViewMode("lyrics")}
      >
        <Ionicons
          name="chatbubble-outline"
          size={20}
          color={viewMode === "lyrics" ? "#00E5CC" : "#777"}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.bottomTab, viewMode === "chords" && styles.bottomTabActive]}
        onPress={() => setViewMode("chords")}
      >
        <Ionicons
          name="grid"
          size={20}
          color={viewMode === "chords" ? "#00E5CC" : "#777"}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.bottomTab, viewMode === "mixer" && styles.bottomTabActive]}
        onPress={() => setViewMode("mixer")}
      >
        <Ionicons
          name="repeat"
          size={20}
          color={viewMode === "mixer" ? "#00E5CC" : "#777"}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.bottomTab}
        onPress={handleStartLesson}
      >
        <Ionicons
          name="school-outline"
          size={20}
          color="#FFD700"
        />
      </TouchableOpacity>
    </View>
  );

  // ─── Song Settings Modal ─────────────────────────────────────────────────
  const renderSettingsModal = () => (
    <Modal visible={showSettings} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Song settings</Text>

          {/* Reset */}
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="refresh" size={22} color="#AAA" />
            <Text style={styles.settingText}>Reset to original</Text>
          </TouchableOpacity>

          {/* Export */}
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="download-outline" size={22} color="#AAA" />
            <Text style={styles.settingText}>Export</Text>
            <Ionicons name="chevron-forward" size={18} color="#555" style={styles.settingChevron} />
          </TouchableOpacity>

          {/* Separation */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              const next: SeparationQuality =
                quality === "4-track" ? "8-track" : quality === "8-track" ? "16-track-hifi" : "4-track";
              handleQualityChange(next);
            }}
          >
            <Ionicons name="options-outline" size={22} color="#AAA" />
            <Text style={styles.settingText}>Separation</Text>
            <Text style={styles.settingValue}>
              {quality === "4-track" ? "4 Tracks" : quality === "8-track" ? "8 Tracks" : "16 Tracks (Hi-Fi)"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#555" style={styles.settingChevron} />
          </TouchableOpacity>

          {/* Count in */}
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingIcon}>1 2{"\n"}3 4</Text>
            <Text style={styles.settingText}>Count in</Text>
            <Text style={styles.settingValue}>OFF</Text>
            <Ionicons name="chevron-forward" size={18} color="#555" style={styles.settingChevron} />
          </TouchableOpacity>

          {/* Trim */}
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="cut-outline" size={22} color="#AAA" />
            <Text style={styles.settingText}>Trim</Text>
            <Ionicons name="chevron-forward" size={18} color="#555" style={styles.settingChevron} />
          </TouchableOpacity>

          {/* Chords */}
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="musical-notes-outline" size={22} color="#AAA" />
            <Text style={styles.settingText}>Chords</Text>
            <Ionicons name="chevron-forward" size={18} color="#555" style={styles.settingChevron} />
          </TouchableOpacity>

          {/* Edit Lyrics */}
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="create-outline" size={22} color="#AAA" />
            <Text style={styles.settingText}>Edit Lyrics</Text>
          </TouchableOpacity>

          {/* Repeat */}
          <View style={styles.settingRow}>
            <Ionicons name="repeat" size={22} color="#AAA" />
            <Text style={styles.settingText}>Play song on repeat</Text>
            <Switch
              value={isRepeat}
              onValueChange={setIsRepeat}
              trackColor={{ false: "#333", true: "#00E5CC" }}
              thumbColor="#FFFFFF"
              style={styles.settingSwitch}
            />
          </View>

          {/* File info */}
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="document-text-outline" size={22} color="#AAA" />
            <Text style={styles.settingText}>File info</Text>
          </TouchableOpacity>

          {/* Close */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowSettings(false)}
          >
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ─── Main Render ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <Ionicons name="sync" size={32} color="#00E5CC" />
              <Text style={styles.processingText}>{processingStage}</Text>
              <View style={styles.processingBarContainer}>
                <View style={[styles.processingBar, { width: `${processingProgress}%` }]} />
              </View>
              <Text style={styles.processingPercent}>{processingProgress}%</Text>
            </View>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-down" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {uploadedFile ? uploadedFile.name : songTitle}
          </Text>
          <TouchableOpacity style={styles.headerBtn} onPress={pickAndProcessAudio}>
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="menu" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Chord Bar */}
        {renderChordBar()}

        {/* Content Area */}
        <View style={styles.contentArea}>
          {viewMode === "mixer" && renderMixerView()}
          {viewMode === "chords" && renderChordGridView()}
          {viewMode === "lyrics" && renderLyricsView()}
        </View>

        {/* Playback Controls */}
        {renderPlaybackControls()}

        {/* Bottom Tabs */}
        {renderBottomTabs()}
      </SafeAreaView>

      {/* Settings Modal */}
      {renderSettingsModal()}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  safeArea: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBtn: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  // Chord Bar
  chordBar: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  chordBarMeasure: {
    flex: 1,
    flexDirection: "row",
    gap: 2,
  },
  chordBeat: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  chordText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Content
  contentArea: {
    flex: 1,
  },
  // Mixer
  mixerScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  stemIconContainer: {
    width: 32,
    alignItems: "center",
    position: "relative",
  },
  stemNumber: {
    position: "absolute",
    bottom: -6,
    right: -4,
    backgroundColor: "#555",
    borderRadius: 8,
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  stemNumberText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  sliderContainer: {
    flex: 1,
    height: 24,
    justifyContent: "center",
    position: "relative",
  },
  sliderTrack: {
    height: 3,
    borderRadius: 2,
    position: "relative",
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  sliderThumb: {
    position: "absolute",
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#000",
    borderWidth: 2,
    marginLeft: -8,
  },
  sliderTouchArea: {
    ...StyleSheet.absoluteFillObject,
  },
  stemAction: {
    padding: 8,
  },
  // Chord Grid
  chordGridScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  measureNumber: {
    color: "#555",
    fontSize: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  chordGridRow: {
    flexDirection: "row",
    gap: 4,
  },
  chordGridCell: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  chordGridText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Lyrics
  lyricsScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  lyricBlock: {
    marginBottom: 8,
  },
  lyricChordRow: {
    flexDirection: "row",
    gap: 3,
    marginBottom: 4,
  },
  lyricChordCell: {
    flex: 1,
    height: 40,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  lyricChordText: {
    fontSize: 12,
    fontWeight: "600",
  },
  lyricText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 4,
  },
  // Playback
  playbackSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    position: "relative",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  progressThumb: {
    position: "absolute",
    top: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    marginLeft: -6,
  },
  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeText: {
    color: "#888",
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 8,
  },
  controlBtn: {
    padding: 8,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  keyChangeText: {
    color: "#AAA",
    fontSize: 16,
    fontWeight: "700",
  },
  // Bottom Tabs
  bottomTabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#222",
  },
  bottomTab: {
    padding: 8,
    borderRadius: 8,
  },
  bottomTabActive: {
    backgroundColor: "#1A1A1A",
  },
  // Settings Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
    gap: 14,
  },
  settingIcon: {
    color: "#AAA",
    fontSize: 11,
    fontWeight: "700",
    width: 22,
    textAlign: "center",
  },
  settingText: {
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
  },
  settingValue: {
    color: "#00E5CC",
    fontSize: 14,
  },
  settingChevron: {
    marginLeft: 4,
  },
  settingSwitch: {
    marginLeft: "auto",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Processing overlay
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  processingCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    gap: 12,
  },
  processingText: {
    color: "#CCCCCC",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  processingBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  processingBar: {
    height: "100%",
    backgroundColor: "#00E5CC",
    borderRadius: 3,
  },
  processingPercent: {
    color: "#00E5CC",
    fontSize: 16,
    fontWeight: "700",
  },
});
