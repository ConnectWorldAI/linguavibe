import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#FFD700", // Gold
  "#FF6B6B", // Coral
  "#4ECDC4", // Teal
  "#A78BFA", // Purple
  "#F97316", // Orange
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#EC4899", // Pink
  "#EAB308", // Yellow
  "#14B8A6", // Emerald
];

const CONFETTI_COUNT = 30;

interface ConfettiPieceProps {
  index: number;
  containerHeight: number;
  onComplete?: () => void;
  isLast?: boolean;
}

function ConfettiPiece({ index, containerHeight, onComplete, isLast }: ConfettiPieceProps) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  const startX = Math.random() * SCREEN_WIDTH;
  const size = 6 + Math.random() * 8;
  const delay = Math.random() * 600;
  const duration = 2000 + Math.random() * 1500;
  const swayAmount = 30 + Math.random() * 40;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const isRound = index % 3 === 0;

  useEffect(() => {
    // Scale in
    scale.value = withDelay(delay, withTiming(1, { duration: 200 }));

    // Fall down
    translateY.value = withDelay(
      delay,
      withTiming(containerHeight + 50, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Sway left-right
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(swayAmount, { duration: duration / 4, easing: Easing.inOut(Easing.ease) }),
          withTiming(-swayAmount, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration / 4, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Spin
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: 1000 + Math.random() * 1000, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Fade out near end
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 }, (finished) => {
        if (finished && isLast && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          top: -20,
          width: size,
          height: isRound ? size : size * 1.5,
          backgroundColor: color,
          borderRadius: isRound ? size / 2 : 2,
        },
        animatedStyle,
      ]}
    />
  );
}

interface ConfettiAnimationProps {
  visible: boolean;
  onComplete?: () => void;
}

export function ConfettiAnimation({ visible, onComplete }: ConfettiAnimationProps) {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <ConfettiPiece
          key={i}
          index={i}
          containerHeight={400}
          onComplete={onComplete}
          isLast={i === CONFETTI_COUNT - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 100,
  },
});
