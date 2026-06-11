/**
 * Rate Limit Toast — shows a "slow down" message when AI security
 * returns a rate-limit error. Appears as an overlay toast that auto-dismisses.
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOAST_DURATION = 4000; // 4 seconds

interface RateLimitToastProps {
  visible: boolean;
  onDismiss: () => void;
  /** How many seconds until they can try again */
  retryAfterSeconds?: number;
  /** Custom message override */
  message?: string;
}

export function RateLimitToast({
  visible,
  onDismiss,
  retryAfterSeconds,
  message,
}: RateLimitToastProps) {
  const colors = useColors();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Progress bar countdown
      progressWidth.setValue(1);
      Animated.timing(progressWidth, {
        toValue: 0,
        duration: TOAST_DURATION,
        useNativeDriver: false,
      }).start();

      // Auto-dismiss
      const timer = setTimeout(() => {
        dismissToast();
      }, TOAST_DURATION);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const displayMessage = message
    ? message
    : retryAfterSeconds
    ? `Slow down! Try again in ${retryAfterSeconds}s`
    : "You're sending requests too fast. Please wait a moment.";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.warning + "F5",
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>⏳</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: "#1a1a1a" }]}>Rate Limited</Text>
          <Text style={[styles.message, { color: "#333" }]}>{displayMessage}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: "#00000030",
            width: progressWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 16,
    right: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
  },
});
