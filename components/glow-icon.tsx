import { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize } from "../constants/Colors";

type GlowIconProps = {
  icon: string;
  size?: number;
  color?: string;
  isGlowing: boolean;
  count: number;
  glowColor: string;
};

export function GlowIcon({ icon, size = 24, color, isGlowing, count, glowColor }: GlowIconProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isGlowing) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
          ]),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0);
    }
  }, [isGlowing]);

  return (
    <View style={styles.container}>
      {/* Glow ring */}
      {isGlowing && (
        <Animated.View
          style={[
            styles.glowRing,
            {
              borderColor: glowColor,
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
              shadowColor: glowColor,
            },
          ]}
        />
      )}
      {/* Icon */}
      <Ionicons name={icon as any} size={size} color={isGlowing ? glowColor : (color || Colors.textSecondary)} />
      {/* Badge count */}
      {isGlowing && count > 0 && (
        <View style={[styles.badge, { backgroundColor: glowColor }]}>
          <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  glowRing: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
