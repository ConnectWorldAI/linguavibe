import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import { useI18n, SUPPORTED_LANGUAGES } from "@/lib/i18n";

const { width, height } = Dimensions.get("window");

export default function SocialTranslateBrowserScreen() {
  const { t, language } = useI18n();
  const params = useLocalSearchParams<{ url?: string; platform?: string }>();
  const [url, setUrl] = useState(params.url || "https://instagram.com");
  const [isLoading, setIsLoading] = useState(true);
  const [showTranslatePanel, setShowTranslatePanel] = useState(false);
  const [targetLang, setTargetLang] = useState(language);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);

  const handleTranslate = () => {
    setIsTranslating(true);
    // Simulate translation (will connect to backend)
    setTimeout(() => {
      setTranslatedContent(
        "This is the translated content of the page. In production, Apify will scrape the page content and OpenAI will translate it to your selected language."
      );
      setIsTranslating(false);
    }, 2000);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        {/* Browser Header */}
        <View style={styles.browserHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.urlBar}>
            <Ionicons name="lock-closed" size={12} color={Colors.success} />
            <Text style={styles.urlText} numberOfLines={1}>
              {url}
            </Text>
          </View>
          <TouchableOpacity style={styles.navBtn}>
            <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* WebView Placeholder (actual WebView would be used on native) */}
        <View style={styles.webviewContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.secondary} />
              <Text style={styles.loadingText}>Loading page...</Text>
            </View>
          )}
          {/* Simulated page content */}
          <ScrollView
            style={styles.simulatedPage}
            onLayout={() => setTimeout(() => setIsLoading(false), 1500)}
          >
            <View style={styles.simPost}>
              <View style={styles.simPostHeader}>
                <View style={styles.simAvatar} />
                <View>
                  <Text style={styles.simUsername}>@usuario_ejemplo</Text>
                  <Text style={styles.simTime}>2h ago</Text>
                </View>
              </View>
              <View style={styles.simImage} />
              <Text style={styles.simCaption}>
                Hoy fue un día increíble en la playa. El atardecer estaba hermoso y la comida estuvo deliciosa. 🌅🏖️ #VidaPlayera #Felicidad
              </Text>
              <View style={styles.simActions}>
                <Ionicons name="heart-outline" size={22} color={Colors.textPrimary} />
                <Ionicons name="chatbubble-outline" size={20} color={Colors.textPrimary} />
                <Ionicons name="paper-plane-outline" size={20} color={Colors.textPrimary} />
              </View>
            </View>

            <View style={styles.simPost}>
              <View style={styles.simPostHeader}>
                <View style={[styles.simAvatar, { backgroundColor: "#6C5CE730" }]} />
                <View>
                  <Text style={styles.simUsername}>@musica_latina</Text>
                  <Text style={styles.simTime}>5h ago</Text>
                </View>
              </View>
              <View style={[styles.simImage, { backgroundColor: "#2d1b3d" }]} />
              <Text style={styles.simCaption}>
                Nueva canción disponible! Escúchenla y díganme qué les parece. El ritmo es fuego 🔥🎶 #MúsicaLatina #NuevoSencillo
              </Text>
              <View style={styles.simActions}>
                <Ionicons name="heart-outline" size={22} color={Colors.textPrimary} />
                <Ionicons name="chatbubble-outline" size={20} color={Colors.textPrimary} />
                <Ionicons name="paper-plane-outline" size={20} color={Colors.textPrimary} />
              </View>
            </View>
            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Translation Result Overlay */}
          {translatedContent && (
            <View style={styles.translationOverlay}>
              <View style={styles.translationCard}>
                <View style={styles.translationCardHeader}>
                  <Text style={styles.translationCardTitle}>
                    {SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.flag}{" "}
                    {SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name}
                  </Text>
                  <TouchableOpacity onPress={() => setTranslatedContent(null)}>
                    <Ionicons name="close" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.translationCardText}>{translatedContent}</Text>
                <View style={styles.translationCardActions}>
                  <TouchableOpacity style={styles.translationCardAction}>
                    <Ionicons name="volume-high" size={16} color={Colors.secondary} />
                    <Text style={styles.translationCardActionText}>Listen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.translationCardAction}>
                    <Ionicons name="copy-outline" size={16} color={Colors.secondary} />
                    <Text style={styles.translationCardActionText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.translationCardAction}>
                    <Ionicons name="school-outline" size={16} color={Colors.secondary} />
                    <Text style={styles.translationCardActionText}>Learn</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Floating Translate Button */}
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() => setShowTranslatePanel(!showTranslatePanel)}
          activeOpacity={0.85}
        >
          <Ionicons name="language" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Translate Panel (slides up from floating button) */}
        {showTranslatePanel && (
          <View style={styles.translatePanel}>
            <View style={styles.translatePanelHeader}>
              <Text style={styles.translatePanelTitle}>Translate Page</Text>
              <TouchableOpacity onPress={() => setShowTranslatePanel(false)}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.translatePanelSubtitle}>
              Select target language and tap translate
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
            >
              {SUPPORTED_LANGUAGES.slice(0, 12).map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langChip,
                    targetLang === lang.code && styles.langChipActive,
                  ]}
                  onPress={() => setTargetLang(lang.code)}
                >
                  <Text style={styles.langChipFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.langChipName,
                      targetLang === lang.code && styles.langChipNameActive,
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.translatePanelBtn}
              onPress={() => {
                handleTranslate();
                setShowTranslatePanel(false);
              }}
              activeOpacity={0.8}
            >
              {isTranslating ? (
                <ActivityIndicator size="small" color="#060912" />
              ) : (
                <>
                  <Ionicons name="language" size={20} color="#060912" />
                  <Text style={styles.translatePanelBtnText}>Translate This Page</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  browserHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  urlBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  webviewContainer: {
    flex: 1,
    position: "relative",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  simulatedPage: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  simPost: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  simPostHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  simAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E4405F30",
  },
  simUsername: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  simTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  simImage: {
    width: "100%",
    height: 220,
    borderRadius: 8,
    backgroundColor: "#1a2744",
    marginBottom: 10,
  },
  simCaption: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 10,
  },
  simActions: {
    flexDirection: "row",
    gap: 16,
  },
  // Floating button
  floatingBtn: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  // Translate panel
  translatePanel: {
    position: "absolute",
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 99,
  },
  translatePanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  translatePanelTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  translatePanelSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langChipActive: {
    backgroundColor: Colors.secondary + "20",
    borderColor: Colors.secondary,
  },
  langChipFlag: {
    fontSize: 14,
  },
  langChipName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  langChipNameActive: {
    color: Colors.secondary,
  },
  translatePanelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingVertical: 12,
    marginTop: 12,
  },
  translatePanelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#060912",
  },
  // Translation overlay
  translationOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 50,
  },
  translationCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  translationCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  translationCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.secondary,
  },
  translationCardText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  translationCardActions: {
    flexDirection: "row",
    gap: 16,
  },
  translationCardAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  translationCardActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.secondary,
  },
});
