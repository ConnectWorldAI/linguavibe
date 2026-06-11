/**
 * Duel Recording Overlay
 *
 * Provides a screen-recording UI overlay during pronunciation duels.
 * Captures duel highlights with timer, visual indicators, and export options.
 * Uses a combination of screen capture state tracking and shareable content generation.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated as RNAnimated,
  Platform,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, FontSize, BorderRadius } from "@/constants/Colors";

interface DuelRecordingOverlayProps {
  visible: boolean;
  playerName: string;
  opponentName: string;
  currentRound: number;
  totalRounds: number;
  playerScore: number;
  opponentScore: number;
  mode: string;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onExport?: (data: RecordingData) => void;
}

export interface RecordingData {
  id: string;
  duration: number;
  startTime: number;
  endTime: number;
  playerName: string;
  opponentName: string;
  finalPlayerScore: number;
  finalOpponentScore: number;
  mode: string;
  rounds: number;
  highlights: RecordingHighlight[];
}

interface RecordingHighlight {
  timestamp: number;
  type: "round_win" | "perfect_score" | "streak" | "comeback";
  description: string;
}

export function DuelRecordingOverlay({
  visible,
  playerName,
  opponentName,
  currentRound,
  totalRounds,
  playerScore,
  opponentScore,
  mode,
  onStartRecording,
  onStopRecording,
  onExport,
}: DuelRecordingOverlayProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [highlights, setHighlights] = useState<RecordingHighlight[]>([]);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevScoreRef = useRef(playerScore);

  // Pulse animation for recording indicator
  useEffect(() => {
    if (isRecording) {
      const pulse = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Auto-detect highlights
  useEffect(() => {
    if (!isRecording) return;
    const now = Date.now();

    // Detect round wins
    if (playerScore > prevScoreRef.current && playerScore > opponentScore) {
      setHighlights(prev => [...prev, {
        timestamp: now,
        type: "round_win",
        description: `Round ${currentRound} won!`,
      }]);
    }

    // Detect perfect scores
    if (playerScore - prevScoreRef.current >= 95) {
      setHighlights(prev => [...prev, {
        timestamp: now,
        type: "perfect_score",
        description: "Near-perfect pronunciation!",
      }]);
    }

    prevScoreRef.current = playerScore;
  }, [playerScore, currentRound]);

  const handleToggleRecording = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      onStopRecording?.();

      const data: RecordingData = {
        id: `rec_${Date.now()}`,
        duration: recordingDuration,
        startTime,
        endTime: Date.now(),
        playerName,
        opponentName,
        finalPlayerScore: playerScore,
        finalOpponentScore: opponentScore,
        mode,
        rounds: totalRounds,
        highlights,
      };

      onExport?.(data);
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingDuration(0);
      setStartTime(Date.now());
      setHighlights([]);
      onStartRecording?.();
    }
  }, [isRecording, recordingDuration, startTime, playerName, opponentName, playerScore, opponentScore, mode, totalRounds, highlights]);

  const handleShareHighlight = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = playerScore > opponentScore ? "winning" : "battling";
    const message = `🎤 Live Pronunciation Duel!\n\n${playerName} is ${result} against ${opponentName}\nScore: ${playerScore} vs ${opponentScore}\nMode: ${mode === "tongue_twister" ? "Tongue Twister" : mode === "phrase_race" ? "Phrase Race" : "Word Flash"}\n\nWatch the duel on LinguaVibe! 🔥`;
    try {
      await Share.share({ message });
    } catch {}
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Top Recording Bar */}
      <View style={styles.topBar}>
        {/* Recording Indicator */}
        <View style={styles.recordingIndicator}>
          <RNAnimated.View style={[styles.recordDot, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.recordDotInner, isRecording && styles.recordDotActive]} />
          </RNAnimated.View>
          <Text style={[styles.recordText, isRecording && styles.recordTextActive]}>
            {isRecording ? "REC" : "TAP TO REC"}
          </Text>
          {isRecording && (
            <Text style={styles.timerText}>{formatTime(recordingDuration)}</Text>
          )}
        </View>

        {/* Score Display */}
        <View style={styles.scoreDisplay}>
          <Text style={styles.scorePlayer}>{playerScore}</Text>
          <Text style={styles.scoreSeparator}>-</Text>
          <Text style={styles.scoreOpponent}>{opponentScore}</Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        {/* Record Button */}
        <TouchableOpacity
          style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
          onPress={handleToggleRecording}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isRecording ? "stop" : "radio-button-on"}
            size={24}
            color={isRecording ? "#fff" : Colors.accent}
          />
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShareHighlight}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social" size={20} color={Colors.secondary} />
        </TouchableOpacity>

        {/* Highlight Counter */}
        {highlights.length > 0 && (
          <View style={styles.highlightBadge}>
            <Ionicons name="star" size={12} color={Colors.gold} />
            <Text style={styles.highlightCount}>{highlights.length}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    pointerEvents: "box-none",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  recordDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  recordDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  recordDotActive: {
    backgroundColor: Colors.accent,
  },
  recordText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  recordTextActive: {
    color: Colors.accent,
  },
  timerText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 4,
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  scorePlayer: { fontSize: FontSize.sm, fontWeight: "800", color: Colors.success },
  scoreSeparator: { fontSize: FontSize.sm, color: "#fff" },
  scoreOpponent: { fontSize: FontSize.sm, fontWeight: "800", color: Colors.accent },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 16,
  },
  recordBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.accent + "80",
  },
  recordBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  highlightBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  highlightCount: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.gold },
});
