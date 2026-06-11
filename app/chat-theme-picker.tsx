import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { getChatTheme, setChatTheme, CHAT_THEMES, type ChatTheme } from "@/lib/chat-media-store";
import { LinearGradient } from "expo-linear-gradient";

// Lazy-load image picker
let ImagePicker: any = null;
if (Platform.OS !== "web") {
  ImagePicker = require("expo-image-picker");
}

export default function ChatThemePickerScreen() {
  const params = useLocalSearchParams<{
    contactId?: string;
    contactName?: string;
  }>();

  const contactId = params.contactId || "unknown";
  const contactName = params.contactName || "Contact";

  const [selectedTheme, setSelectedTheme] = useState<ChatTheme | null>(null);
  const [originalTheme, setOriginalTheme] = useState<ChatTheme | null>(null);

  useEffect(() => {
    loadTheme();
  }, [contactId]);

  const loadTheme = async () => {
    const theme = await getChatTheme(contactId);
    setSelectedTheme(theme);
    setOriginalTheme(theme);
  };

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectTheme = (theme: ChatTheme) => {
    haptic();
    setSelectedTheme(theme);
  };

  const applyTheme = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setChatTheme(contactId, selectedTheme);
    router.back();
  };

  const resetTheme = async () => {
    haptic();
    setSelectedTheme(null);
    await setChatTheme(contactId, null);
  };

  const isSelected = (theme: ChatTheme) => {
    if (!selectedTheme) return false;
    return selectedTheme.name === theme.name;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Theme</Text>
        <TouchableOpacity style={styles.applyBtn} onPress={applyTheme}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContainer}>
            {selectedTheme ? (
              selectedTheme.type === "image" && selectedTheme.imageUri ? (
                <ImageBackground
                  source={{ uri: selectedTheme.imageUri }}
                  style={styles.previewBg}
                  imageStyle={{ opacity: 0.4 }}
                  resizeMode="cover"
                >
                  {renderPreviewMessages()}
                </ImageBackground>
              ) : selectedTheme.type === "gradient" ? (
                <LinearGradient
                  colors={selectedTheme.colors as [string, string, ...string[]]}
                  style={styles.previewBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {renderPreviewMessages()}
                </LinearGradient>
              ) : (
                <View style={[styles.previewBg, { backgroundColor: selectedTheme.colors[0] }]}>
                  {renderPreviewMessages()}
                </View>
              )
            ) : (
              <View style={[styles.previewBg, { backgroundColor: Colors.primary }]}>
                {renderPreviewMessages()}
              </View>
            )}
          </View>
          <Text style={styles.previewLabel}>
            {selectedTheme ? selectedTheme.name : "Default"}
          </Text>
        </View>

        {/* Reset Option */}
        <View style={styles.resetSection}>
          <TouchableOpacity style={styles.resetBtn} onPress={resetTheme} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color={Colors.secondary} />
            <Text style={styles.resetText}>Reset to Default</Text>
          </TouchableOpacity>
        </View>

        {/* Gradient Themes */}
        <View style={styles.themeSection}>
          <Text style={styles.sectionTitle}>Gradients</Text>
          <View style={styles.themeGrid}>
            {CHAT_THEMES.filter(t => t.type === "gradient").map((theme) => (
              <TouchableOpacity
                key={theme.name}
                style={[styles.themeItem, isSelected(theme) && styles.themeItemSelected]}
                onPress={() => selectTheme(theme)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={theme.colors as [string, string, ...string[]]}
                  style={styles.themePreview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isSelected(theme) && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </LinearGradient>
                <Text style={styles.themeName} numberOfLines={1}>{theme.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Solid Themes */}
        <View style={styles.themeSection}>
          <Text style={styles.sectionTitle}>Solid Colors</Text>
          <View style={styles.themeGrid}>
            {CHAT_THEMES.filter(t => t.type === "solid").map((theme) => (
              <TouchableOpacity
                key={theme.name}
                style={[styles.themeItem, isSelected(theme) && styles.themeItemSelected]}
                onPress={() => selectTheme(theme)}
                activeOpacity={0.7}
              >
                <View style={[styles.themePreview, { backgroundColor: theme.colors[0] }]}>
                  {isSelected(theme) && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={styles.themeName} numberOfLines={1}>{theme.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Color Section */}
        <View style={styles.themeSection}>
          <Text style={styles.sectionTitle}>Custom</Text>
          <View style={styles.customSection}>
            <View style={styles.customColorRow}>
              {["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF9FF3", "#54A0FF"].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.customColorDot,
                    { backgroundColor: color },
                    selectedTheme?.colors[0] === color && styles.customColorDotSelected,
                  ]}
                  onPress={() => selectTheme({ type: "solid", colors: [color], name: "Custom" })}
                />
              ))}
            </View>
            <View style={styles.customColorRow}>
              {["#5F27CD", "#341F97", "#0ABDE3", "#10AC84", "#EE5A24", "#F368E0", "#2E86DE", "#01A3A4"].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.customColorDot,
                    { backgroundColor: color },
                    selectedTheme?.colors[0] === color && styles.customColorDotSelected,
                  ]}
                  onPress={() => selectTheme({ type: "solid", colors: [color], name: "Custom" })}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Wallpaper from Camera Roll */}
        <View style={[styles.themeSection, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Photo Wallpaper</Text>
          <View style={styles.wallpaperSection}>
            <TouchableOpacity
              style={styles.wallpaperPickBtn}
              onPress={async () => {
                haptic();
                if (Platform.OS === "web") {
                  // Web file input fallback
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const uri = URL.createObjectURL(file);
                      selectTheme({ type: "image", colors: ["#000"], name: "Photo", imageUri: uri });
                    }
                  };
                  input.click();
                  return;
                }
                if (!ImagePicker) return;
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") return;
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [9, 16],
                  quality: 0.8,
                });
                if (!result.canceled && result.assets?.[0]?.uri) {
                  selectTheme({ type: "image", colors: ["#000"], name: "Photo", imageUri: result.assets[0].uri });
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.wallpaperPickIcon}>
                <Ionicons name="image" size={24} color={Colors.secondary} />
              </View>
              <View style={styles.wallpaperPickInfo}>
                <Text style={styles.wallpaperPickTitle}>Choose from Camera Roll</Text>
                <Text style={styles.wallpaperPickSubtitle}>Select a photo to use as chat background</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
            {selectedTheme?.type === "image" && selectedTheme.imageUri && (
              <View style={styles.wallpaperPreviewRow}>
                <Image source={{ uri: selectedTheme.imageUri }} style={styles.wallpaperThumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.wallpaperActiveLabel}>Active Wallpaper</Text>
                  <Text style={styles.wallpaperActiveSubtext}>Custom photo background</Text>
                </View>
                <TouchableOpacity onPress={() => { haptic(); setSelectedTheme(null); }} style={styles.wallpaperRemoveBtn}>
                  <Ionicons name="close-circle" size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── PREVIEW MESSAGES ────────────────────────────────────────────────────────
function renderPreviewMessages() {
  return (
    <View style={styles.previewMessages}>
      <View style={styles.previewMsgTheirs}>
        <Text style={styles.previewMsgTheirsText}>{"\u00a1Hola! \u00bfC\u00f3mo est\u00e1s?"}</Text>
      </View>
      <View style={styles.previewMsgMine}>
        <Text style={styles.previewMsgMineText}>{"I'm great! Practicing my Spanish \ud83c\uddea\ud83c\uddf8"}</Text>
      </View>
      <View style={styles.previewMsgTheirs}>
        <Text style={styles.previewMsgTheirsText}>{"\u00a1Muy bien! Sigue as\u00ed \ud83d\udc4f"}</Text>
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
  },
  applyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Preview
  previewSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  previewContainer: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewBg: {
    width: "100%",
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: 180,
    justifyContent: "center",
  },
  previewMessages: {
    gap: 8,
  },
  previewMsgTheirs: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "70%",
  },
  previewMsgTheirsText: {
    fontSize: 13,
    color: "#fff",
    lineHeight: 18,
  },
  previewMsgMine: {
    alignSelf: "flex-end",
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "70%",
  },
  previewMsgMineText: {
    fontSize: 13,
    color: "#fff",
    lineHeight: 18,
  },
  previewLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: "600",
  },
  // Reset
  resetSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: "600",
  },
  // Theme Grid
  themeSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  themeItem: {
    width: 72,
    alignItems: "center",
    gap: 6,
  },
  themeItemSelected: {
    transform: [{ scale: 1.05 }],
  },
  themePreview: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  themeName: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
  // Custom Colors
  customSection: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  customColorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  customColorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  customColorDotSelected: {
    borderColor: "#fff",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  wallpaperSection: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  wallpaperPickBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  wallpaperPickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  wallpaperPickInfo: {
    flex: 1,
  },
  wallpaperPickTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  wallpaperPickSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  wallpaperPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    gap: 12,
  },
  wallpaperThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  wallpaperActiveLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  wallpaperActiveSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  wallpaperRemoveBtn: {
    padding: 4,
  },
});
