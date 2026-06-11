import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMusicPlayer } from "@/lib/music-player-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useEffect } from "react";

// ─── Waveform Bar Component ─────────────────────────────────────────────────

function WaveformBar({ index, isPlaying }: { index: number; isPlaying: boolean }) {
  const height = useSharedValue(4);

  useEffect(() => {
    if (isPlaying) {
      const minH = 3 + (index % 3);
      const maxH = 10 + (index % 4) * 3;
      const duration = 300 + (index % 3) * 100;
      height.value = withRepeat(
        withSequence(
          withDelay(
            index * 60,
            withTiming(maxH, { duration, easing: Easing.inOut(Easing.ease) })
          ),
          withTiming(minH, { duration: duration + 50, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      height.value = withTiming(4, { duration: 200 });
    }
  }, [isPlaying, index, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.waveformBar,
        animatedStyle,
        { backgroundColor: isPlaying ? "#6366F1" : "#4B5563" },
      ]}
    />
  );
}

// ─── Mini Player Component ──────────────────────────────────────────────────

export function MiniPlayer() {
  const { currentTrack, isPlaying, progress, pause, resume, dismiss, isVisible, skipNext, skipPrevious, queue } = useMusicPlayer();
  const translateX = useSharedValue(0);

  if (!isVisible || !currentTrack) return null;

  const handlePlayPause = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handlePress = () => {
    router.push("/now-playing" as any);
  };

  const handleDismiss = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    dismiss();
  };

  // Swipe-to-dismiss gesture
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 100) {
        // Swipe far enough — dismiss
        translateX.value = withTiming(
          e.translationX > 0 ? 400 : -400,
          { duration: 200 },
          () => {
            runOnJS(handleDismiss)();
          }
        );
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
      }
    });

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: 1 - Math.abs(translateX.value) / 400,
  }));

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View
        entering={FadeInDown.duration(250)}
        exiting={FadeOutDown.duration(200)}
        style={[styles.container, swipeStyle]}
      >
        {/* Progress bar at top */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <TouchableOpacity style={styles.content} onPress={handlePress} activeOpacity={0.8}>
          {/* Album art with waveform */}
          <View style={[styles.artwork, { backgroundColor: currentTrack.artworkColor || "#6366F1" }]}>
            {isPlaying ? (
              <View style={styles.waveformContainer}>
                {[0, 1, 2, 3].map((i) => (
                  <WaveformBar key={i} index={i} isPlaying={isPlaying} />
                ))}
              </View>
            ) : (
              <Ionicons name="musical-notes" size={16} color="#FFFFFF" />
            )}
          </View>

          {/* Track info */}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {currentTrack.languageFlag ? `${currentTrack.languageFlag} ` : ""}{currentTrack.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          {/* Now Playing waveform indicator */}
          {isPlaying && (
            <View style={styles.nowPlayingBars}>
              {[0, 1, 2, 3, 4].map((i) => (
                <WaveformBar key={`np_${i}`} index={i + 2} isPlaying={isPlaying} />
              ))}
            </View>
          )}

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); skipPrevious(); }} style={styles.controlBtn}>
              <Ionicons name="play-skip-back" size={16} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlayPause} style={styles.controlBtn}>
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); skipNext(); }} style={styles.controlBtn}>
              <Ionicons name="play-skip-forward" size={16} color={queue.length > 0 ? "#FFFFFF" : "#4B5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDismiss} style={styles.controlBtn}>
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80, // above tab bar
    left: 8,
    right: 8,
    backgroundColor: "#1A1D23",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 0.5,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  progressBar: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    width: "100%",
  },
  progressFill: {
    height: 2,
    backgroundColor: "#6366F1",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  artwork: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 20,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    minHeight: 3,
  },
  info: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  artist: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 1,
  },
  nowPlayingBars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1.5,
    height: 16,
    marginRight: 8,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  controlBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});
