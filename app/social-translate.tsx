import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import { useI18n, SUPPORTED_LANGUAGES } from "@/lib/i18n";

const { width } = Dimensions.get("window");

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  placeholder: string;
}

const PLATFORMS: SocialPlatform[] = [
  { id: "instagram", name: "Instagram", icon: "logo-instagram", color: "#E4405F", placeholder: "Paste Instagram post/reel URL..." },
  { id: "tiktok", name: "TikTok", icon: "musical-notes", color: "#00F2EA", placeholder: "Paste TikTok video URL..." },
  { id: "youtube", name: "YouTube", icon: "logo-youtube", color: "#FF0000", placeholder: "Paste YouTube video URL..." },
  { id: "twitter", name: "X / Twitter", icon: "logo-twitter", color: "#1DA1F2", placeholder: "Paste tweet URL..." },
  { id: "facebook", name: "Facebook", icon: "logo-facebook", color: "#1877F2", placeholder: "Paste Facebook post URL..." },
  { id: "reddit", name: "Reddit", icon: "chatbubble-ellipses", color: "#FF4500", placeholder: "Paste Reddit post URL..." },
];

interface TranslationHistory {
  id: string;
  platform: string;
  url: string;
  originalText: string;
  translatedText: string;
  targetLang: string;
  timestamp: number;
}

export default function SocialTranslateScreen() {
  const router = useRouter();
  const { t, language } = useI18n();
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [url, setUrl] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<TranslationHistory | null>(null);
  const [targetLang, setTargetLang] = useState(language);

  const handleTranslate = () => {
    if (!url.trim()) return;
    setIsTranslating(true);
    // Simulate translation (will be connected to backend AI)
    setTimeout(() => {
      setTranslationResult({
        id: Date.now().toString(),
        platform: selectedPlatform?.id || "unknown",
        url: url,
        originalText: "Esta es una publicación de ejemplo en español que estamos traduciendo para demostrar la funcionalidad de traducción social.",
        translatedText: "This is an example post in Spanish that we are translating to demonstrate the social translation functionality.",
        targetLang: targetLang,
        timestamp: Date.now(),
      });
      setIsTranslating(false);
    }, 2000);
  };

  const handleReset = () => {
    setSelectedPlatform(null);
    setUrl("");
    setTranslationResult(null);
  };

  // Platform selection view
  if (!selectedPlatform) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t.socialTranslate}</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Description */}
          <View style={styles.descCard}>
            <Ionicons name="language" size={28} color={Colors.secondary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.descTitle}>Translate Social Media</Text>
              <Text style={styles.descText}>
                Paste any social media URL and get instant translation of captions, comments, and audio transcriptions.
              </Text>
            </View>
          </View>

          {/* Platform Grid */}
          <Text style={styles.sectionTitle}>Choose Platform</Text>
          <View style={styles.platformGrid}>
            {PLATFORMS.map((platform) => (
              <TouchableOpacity
                key={platform.id}
                style={styles.platformCard}
                onPress={() => setSelectedPlatform(platform)}
                activeOpacity={0.7}
              >
                <View style={[styles.platformIcon, { backgroundColor: platform.color + "20" }]}>
                  <Ionicons name={platform.icon as any} size={28} color={platform.color} />
                </View>
                <Text style={styles.platformName}>{platform.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Browse & Translate */}
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push("/social-translate-browser" as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="globe-outline" size={22} color="#060912" />
            <Text style={styles.browseBtnText}>Browse & Translate</Text>
          </TouchableOpacity>
          <Text style={styles.browseBtnSubtext}>Open in-app browser with floating translate button</Text>

          {/* Recent Translations */}
          <Text style={styles.sectionTitle}>Recent Translations</Text>
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No recent translations</Text>
            <Text style={styles.emptySubtext}>Your translation history will appear here</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // Translation result view
  if (translationResult) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleReset} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Translation</Text>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.resultContainer}>
            {/* Original */}
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultLabel}>Original</Text>
                <TouchableOpacity>
                  <Ionicons name="copy-outline" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.resultText}>{translationResult.originalText}</Text>
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <View style={styles.arrowLine} />
              <View style={styles.arrowCircle}>
                <Ionicons name="arrow-down" size={18} color={Colors.secondary} />
              </View>
              <View style={styles.arrowLine} />
            </View>

            {/* Translated */}
            <View style={[styles.resultCard, styles.resultCardTranslated]}>
              <View style={styles.resultHeader}>
                <Text style={[styles.resultLabel, { color: Colors.secondary }]}>
                  {SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name || "English"}
                </Text>
                <TouchableOpacity>
                  <Ionicons name="copy-outline" size={18} color={Colors.secondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.resultText}>{translationResult.translatedText}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="volume-high" size={20} color={Colors.secondary} />
                <Text style={styles.actionBtnText}>Listen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="bookmark-outline" size={20} color={Colors.secondary} />
                <Text style={styles.actionBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="school-outline" size={20} color={Colors.secondary} />
                <Text style={styles.actionBtnText}>Learn Words</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* New Translation */}
          <TouchableOpacity style={styles.newTranslateBtn} onPress={handleReset}>
            <Ionicons name="add-circle" size={20} color={Colors.secondary} />
            <Text style={styles.newTranslateBtnText}>New Translation</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // URL input view
  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleReset} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerPlatform}>
            <Ionicons name={selectedPlatform.icon as any} size={20} color={selectedPlatform.color} />
            <Text style={styles.headerTitle}>{selectedPlatform.name}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* URL Input */}
        <View style={styles.urlInputContainer}>
          <View style={styles.urlInputWrap}>
            <Ionicons name="link" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.urlInput}
              placeholder={selectedPlatform.placeholder}
              placeholderTextColor={Colors.textMuted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
            />
            {url.length > 0 && (
              <TouchableOpacity onPress={() => setUrl("")}>
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Target Language */}
        <View style={styles.targetLangSection}>
          <Text style={styles.sectionTitle}>Translate to</Text>
          <FlatList
            horizontal
            data={SUPPORTED_LANGUAGES.slice(0, 12)}
            keyExtractor={(item) => item.code}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4 }}
            renderItem={({ item: lang }) => {
              const isSelected = lang.code === targetLang;
              return (
                <TouchableOpacity
                  style={[styles.targetLangChip, isSelected && styles.targetLangChipSelected]}
                  onPress={() => setTargetLang(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.targetLangFlag}>{lang.flag}</Text>
                  <Text style={[styles.targetLangName, isSelected && styles.targetLangNameSelected]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Translation Options</Text>
          <View style={styles.optionRow}>
            <OptionToggle icon="text" label="Captions & Text" defaultOn />
            <OptionToggle icon="chatbubble" label="Comments" defaultOn={false} />
          </View>
          <View style={styles.optionRow}>
            <OptionToggle icon="mic" label="Audio Transcription" defaultOn />
            <OptionToggle icon="image" label="Image Text (OCR)" defaultOn={false} />
          </View>
        </View>

        {/* Translate Button */}
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[styles.translateBtn, !url.trim() && styles.translateBtnDisabled]}
            onPress={handleTranslate}
            disabled={!url.trim() || isTranslating}
            activeOpacity={0.8}
          >
            {isTranslating ? (
              <Text style={styles.translateBtnText}>Translating...</Text>
            ) : (
              <>
                <Ionicons name="language" size={22} color="#060912" />
                <Text style={styles.translateBtnText}>Translate</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

function OptionToggle({ icon, label, defaultOn }: { icon: string; label: string; defaultOn: boolean }) {
  const [enabled, setEnabled] = useState(defaultOn);
  return (
    <TouchableOpacity
      style={[styles.optionToggle, enabled && styles.optionToggleActive]}
      onPress={() => setEnabled(!enabled)}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={18} color={enabled ? Colors.secondary : Colors.textSecondary} />
      <Text style={[styles.optionLabel, enabled && styles.optionLabelActive]}>{label}</Text>
      {enabled && <Ionicons name="checkmark-circle" size={16} color={Colors.secondary} />}
    </TouchableOpacity>
  );
}

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
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerPlatform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Description card
  descCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.glowSubtle,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  descTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  descText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Platform grid
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 28,
  },
  platformCard: {
    width: (width - 24 - 20) / 3,
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  platformName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  // URL Input
  urlInputContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  urlInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  urlInput: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
  },
  // Target language
  targetLangSection: {
    marginBottom: 24,
  },
  targetLangChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  targetLangChipSelected: {
    backgroundColor: Colors.secondary + "20",
    borderColor: Colors.secondary + "60",
  },
  targetLangFlag: {
    fontSize: 16,
  },
  targetLangName: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  targetLangNameSelected: {
    color: Colors.secondary,
  },
  // Options
  optionsSection: {
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  optionToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  optionToggleActive: {
    borderColor: Colors.secondary + "40",
    backgroundColor: Colors.secondary + "08",
  },
  optionLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  optionLabelActive: {
    color: "#fff",
  },
  // Bottom action
  bottomAction: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
  translateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  translateBtnDisabled: {
    opacity: 0.4,
  },
  translateBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#060912",
  },
  // Result
  resultContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  resultCardTranslated: {
    borderColor: Colors.secondary + "30",
    backgroundColor: Colors.secondary + "08",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
  },
  arrowContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  arrowLine: {
    width: 1,
    height: 8,
    backgroundColor: Colors.border,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 24,
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  newTranslateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  newTranslateBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.secondary,
  },
  browseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 14,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
  },
  browseBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#060912",
  },
  browseBtnSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 4,
  },
});
