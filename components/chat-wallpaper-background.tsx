import { View, StyleSheet, ImageBackground } from "react-native";
import { type ChatTheme } from "@/lib/chat-media-store";
import { type ReactNode } from "react";

interface ChatWallpaperBackgroundProps {
  theme: ChatTheme | null;
  children: ReactNode;
  fallbackColor?: string;
}

/**
 * Wraps chat content with the selected wallpaper background.
 * Supports: custom photo from camera roll, solid color, or gradient.
 * Falls back to the provided fallbackColor if no theme is set.
 */
export function ChatWallpaperBackground({ theme, children, fallbackColor = "#0A1628" }: ChatWallpaperBackgroundProps) {
  // Custom photo wallpaper from camera roll
  if (theme?.type === "image" && theme.imageUri) {
    return (
      <ImageBackground
        source={{ uri: theme.imageUri }}
        style={styles.container}
        resizeMode="cover"
        imageStyle={styles.image}
      >
        <View style={styles.overlay}>{children}</View>
      </ImageBackground>
    );
  }

  // Gradient background (approximate with two-tone)
  if (theme?.type === "gradient" && theme.colors.length >= 2) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors[0] }]}>
        {children}
      </View>
    );
  }

  // Solid color
  if (theme?.type === "solid" && theme.colors.length >= 1) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors[0] }]}>
        {children}
      </View>
    );
  }

  // Default fallback
  return (
    <View style={[styles.container, { backgroundColor: fallbackColor }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    opacity: 0.85,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
});
