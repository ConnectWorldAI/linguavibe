import React, { useRef } from "react";
import { Animated, PanResponder, View, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface SwipeToReplyProps {
  children: React.ReactNode;
  onReply: () => void;
  accentColor?: string;
}

export function SwipeToReply({ children, onReply, accentColor = "#007AFF" }: SwipeToReplyProps) {
  const swipeX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dx > 15 && Math.abs(gs.dx) > Math.abs(gs.dy * 1.5),
      onPanResponderMove: (_, gs) => {
        if (gs.dx > 0) {
          swipeX.setValue(Math.min(gs.dx, 80));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > 50) {
          onReply();
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
        Animated.spring(swipeX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      },
    })
  ).current;

  const replyIconOpacity = swipeX.interpolate({
    inputRange: [0, 40, 60],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.replyIcon,
          { opacity: replyIconOpacity },
        ]}
      >
        <Ionicons name="arrow-undo" size={18} color={accentColor} />
      </Animated.View>
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX: swipeX }], flex: 1 }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  replyIcon: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
