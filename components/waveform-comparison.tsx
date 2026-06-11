import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BAR_COUNT = 24;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MAX_BAR_HEIGHT = 48;
const MIN_BAR_HEIGHT = 4;

export type WaveformData = number[]; // Array of amplitudes 0-1

interface WaveformBarProps {
  amplitude: number; // 0-1
  color: string;
  isAnimating: boolean;
  index: number;
}

function WaveformBar({ amplitude, color, isAnimating, index }: WaveformBarProps) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimating) {
      // Staggered wave animation while recording/playing
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 300 + (index % 5) * 80,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 300 + (index % 5) * 80,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      animValue.stopAnimation();
      // Animate to the final amplitude
      Animated.timing(animValue, {
        toValue: amplitude,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [isAnimating, amplitude]);

  const height = isAnimating
    ? animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [MIN_BAR_HEIGHT, MAX_BAR_HEIGHT * 0.7 + Math.random() * MAX_BAR_HEIGHT * 0.3],
      })
    : animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [MIN_BAR_HEIGHT, MAX_BAR_HEIGHT],
      });

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          height,
          backgroundColor: color,
          opacity: amplitude > 0 || isAnimating ? 1 : 0.3,
        },
      ]}
    />
  );
}

interface WaveformDisplayProps {
  data: WaveformData;
  color: string;
  label: string;
  icon: string;
  isAnimating?: boolean;
  isEmpty?: boolean;
}

function WaveformDisplay({ data, color, label, icon, isAnimating = false, isEmpty = false }: WaveformDisplayProps) {
  // Normalize data to BAR_COUNT bars
  const bars = useMemo(() => {
    if (data.length === 0) {
      return Array(BAR_COUNT).fill(0);
    }
    const step = data.length / BAR_COUNT;
    const result: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const start = Math.floor(i * step);
      const end = Math.floor((i + 1) * step);
      const slice = data.slice(start, Math.max(end, start + 1));
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      result.push(Math.min(1, Math.max(0, avg)));
    }
    return result;
  }, [data]);

  return (
    <View style={styles.waveformSection}>
      <View style={styles.waveformLabel}>
        <Ionicons name={icon as any} size={14} color={color} />
        <Text style={[styles.labelText, { color }]}>{label}</Text>
      </View>
      <View style={styles.barsContainer}>
        {isEmpty && !isAnimating ? (
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes-outline" size={20} color={color + "40"} />
            <Text style={[styles.emptyText, { color: color + "60" }]}>No data yet</Text>
          </View>
        ) : (
          bars.map((amp, i) => (
            <WaveformBar
              key={i}
              amplitude={amp}
              color={color}
              isAnimating={isAnimating}
              index={i}
            />
          ))
        )}
      </View>
    </View>
  );
}

export interface WaveformComparisonProps {
  /** Native speaker waveform data (amplitudes 0-1) */
  nativeWaveform: WaveformData;
  /** User recording waveform data (amplitudes 0-1) */
  userWaveform: WaveformData;
  /** Whether the native speaker audio is currently playing */
  isNativePlaying?: boolean;
  /** Whether the user is currently recording */
  isUserRecording?: boolean;
  /** Primary color for native speaker waveform */
  nativeColor?: string;
  /** Primary color for user waveform */
  userColor?: string;
  /** Background color for the card */
  backgroundColor?: string;
  /** Border color for the card */
  borderColor?: string;
  /** Similarity score between the two waveforms (0-100) */
  similarityScore?: number | null;
}

/**
 * WaveformComparison component displays two waveforms side-by-side:
 * - Native speaker (reference) waveform on top
 * - User recording waveform on bottom
 *
 * Supports animated states during recording/playback and shows
 * a similarity score when both waveforms are available.
 */
export function WaveformComparison({
  nativeWaveform,
  userWaveform,
  isNativePlaying = false,
  isUserRecording = false,
  nativeColor = "#4ADE80",
  userColor = "#60A5FA",
  backgroundColor = "rgba(255,255,255,0.04)",
  borderColor = "rgba(255,255,255,0.1)",
  similarityScore = null,
}: WaveformComparisonProps) {
  const hasNative = nativeWaveform.length > 0;
  const hasUser = userWaveform.length > 0;

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={16} color="#FBBF24" />
          <Text style={styles.headerTitle}>Waveform Comparison</Text>
        </View>
        {similarityScore !== null && hasNative && hasUser && (
          <View style={[styles.scoreBadge, {
            backgroundColor: similarityScore >= 80 ? "#4ADE8020" : similarityScore >= 60 ? "#FBBF2420" : "#F8717120",
          }]}>
            <Text style={[styles.scoreText, {
              color: similarityScore >= 80 ? "#4ADE80" : similarityScore >= 60 ? "#FBBF24" : "#F87171",
            }]}>
              {similarityScore}% match
            </Text>
          </View>
        )}
      </View>

      {/* Native Speaker Waveform */}
      <WaveformDisplay
        data={nativeWaveform}
        color={nativeColor}
        label="Native Speaker"
        icon="person"
        isAnimating={isNativePlaying}
        isEmpty={!hasNative && !isNativePlaying}
      />

      {/* Divider */}
      <View style={styles.divider} />

      {/* User Waveform */}
      <WaveformDisplay
        data={userWaveform}
        color={userColor}
        label="Your Recording"
        icon="mic"
        isAnimating={isUserRecording}
        isEmpty={!hasUser && !isUserRecording}
      />

      {/* Hint */}
      {!hasNative && !hasUser && !isUserRecording && !isNativePlaying && (
        <Text style={styles.hint}>
          Record your pronunciation to see waveform comparison
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "700",
  },
  waveformSection: {
    marginVertical: 4,
  },
  waveformLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 11,
    fontWeight: "600",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: MAX_BAR_HEIGHT + 4,
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
    minHeight: MIN_BAR_HEIGHT,
  },
  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: MAX_BAR_HEIGHT,
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 10,
  },
  hint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginTop: 8,
  },
});
