import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
  Alert,
  Modal,
  Animated,
  Dimensions,
  Share,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const { width, height } = Dimensions.get("window");

// Mock Data
const LANGUAGES = [
  { id: "en", name: "English", flag: "🇺🇸" },
  { id: "es", name: "Spanish", flag: "🇪🇸" },
  { id: "fr", name: "French", flag: "🇫🇷" },
  { id: "de", name: "German", flag: "🇩🇪" },
  { id: "ja", name: "Japanese", flag: "🇯🇵" },
  { id: "ko", name: "Korean", flag: "🇰🇷" },
  { id: "zh", name: "Chinese", flag: "🇨🇳" },
  { id: "it", name: "Italian", flag: "🇮🇹" },
  { id: "pt", name: "Portuguese", flag: "🇵🇹" },
  { id: "ru", name: "Russian", flag: "🇷🇺" },
];

const MOCK_HISTORY = [
  { id: "1", speaker: "Alex", original: "Hello, how are you doing today?", translated: "Hola, ¿cómo estás hoy?", time: "10:02 AM", lang: "en" },
  { id: "2", speaker: "Maria", original: "Estoy muy bien, gracias por preguntar.", translated: "I am doing very well, thanks for asking.", time: "10:03 AM", lang: "es" },
  { id: "3", speaker: "Alex", original: "That's great to hear. Are we ready for the meeting?", translated: "Es genial escuchar eso. ¿Estamos listos para la reunión?", time: "10:04 AM", lang: "en" },
  { id: "4", speaker: "Maria", original: "Sí, tengo la presentación lista.", translated: "Yes, I have the presentation ready.", time: "10:05 AM", lang: "es" },
  { id: "5", speaker: "Alex", original: "Perfect, let's start then.", translated: "Perfecto, empecemos entonces.", time: "10:06 AM", lang: "en" },
];

export default function VideoCallCaptionsScreen() {
  // State
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [sourceLang, setSourceLang] = useState(LANGUAGES[0]);
  const [targetLang, setTargetLang] = useState(LANGUAGES[1]);
  const [captionPosition, setCaptionPosition] = useState<"top" | "bottom" | "floating">("bottom");
  const [fontSize, setFontSize] = useState(16);
  const [captionStyle, setCaptionStyle] = useState<"subtitle" | "bubble" | "minimal">("subtitle");
  const [autoDetect, setAutoDetect] = useState(true);
  const [dualLanguage, setDualLanguage] = useState(true);
  
  // Modals
  const [showLangModal, setShowLangModal] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"source" | "target">("source");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load Settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("@video_call_captions_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setCaptionsEnabled(parsed.captionsEnabled ?? true);
        if (parsed.sourceLang) setSourceLang(parsed.sourceLang);
        if (parsed.targetLang) setTargetLang(parsed.targetLang);
        setCaptionPosition(parsed.captionPosition ?? "bottom");
        setFontSize(parsed.fontSize ?? 16);
        setCaptionStyle(parsed.captionStyle ?? "subtitle");
        setAutoDetect(parsed.autoDetect ?? true);
        setDualLanguage(parsed.dualLanguage ?? true);
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        captionsEnabled,
        sourceLang,
        targetLang,
        captionPosition,
        fontSize,
        captionStyle,
        autoDetect,
        dualLanguage,
      };
      await AsyncStorage.setItem("@video_call_captions_settings", JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  };

  // Save settings whenever they change
  useEffect(() => {
    saveSettings();
  }, [captionsEnabled, sourceLang, targetLang, captionPosition, fontSize, captionStyle, autoDetect, dualLanguage]);

  // Handlers
  const handleToggleCaptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCaptionsEnabled(!captionsEnabled);
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleToggleAutoDetect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAutoDetect(!autoDetect);
  };

  const handleToggleDualLanguage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDualLanguage(!dualLanguage);
  };

  const openLangSelector = (type: "source" | "target") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectingFor(type);
    setShowLangModal(true);
  };

  const selectLanguage = (lang: typeof LANGUAGES[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (selectingFor === "source") {
      setSourceLang(lang);
    } else {
      setTargetLang(lang);
    }
    setShowLangModal(false);
  };

  const swapLanguages = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  const handleExportHistory = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const historyText = MOCK_HISTORY.map(
        (item) => `[${item.time}] ${item.speaker}:\nOriginal: ${item.original}\nTranslated: ${item.translated}\n`
      ).join("\n");
      
      await Share.share({
        message: `Video Call Caption History:\n\n${historyText}`,
        title: "Caption History Export",
      });
    } catch (error) {
      Alert.alert("Export Failed", "Could not export caption history.");
    }
  };

  // Renderers
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Video Call Captions</Text>
      <TouchableOpacity 
        style={styles.historyButton} 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowHistoryModal(true);
        }}
      >
        <Ionicons name="time-outline" size={24} color={Colors.secondary} />
      </TouchableOpacity>
    </View>
  );

  const renderMainToggle = () => (
    <View style={styles.mainToggleContainer}>
      <View style={styles.mainToggleTextContainer}>
        <Text style={styles.mainToggleTitle}>Live Translation</Text>
        <Text style={styles.mainToggleSubtitle}>
          {captionsEnabled ? "Captions are active" : "Captions are paused"}
        </Text>
      </View>
      <Switch
        value={captionsEnabled}
        onValueChange={handleToggleCaptions}
        trackColor={{ false: Colors.surfaceCard, true: Colors.secondary }}
        thumbColor={Colors.textPrimary}
        ios_backgroundColor={Colors.surfaceCard}
      />
    </View>
  );

  const renderLanguageSelector = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Languages</Text>
      
      <View style={styles.langSelectorContainer}>
        <TouchableOpacity 
          style={styles.langButton} 
          onPress={() => openLangSelector("source")}
        >
          <Text style={styles.langLabel}>They Speak</Text>
          <View style={styles.langValueContainer}>
            <Text style={styles.langFlag}>{sourceLang.flag}</Text>
            <Text style={styles.langName}>{sourceLang.name}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
          <Ionicons name="swap-horizontal" size={20} color={Colors.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.langButton} 
          onPress={() => openLangSelector("target")}
        >
          <Text style={styles.langLabel}>You Read</Text>
          <View style={styles.langValueContainer}>
            <Text style={styles.langFlag}>{targetLang.flag}</Text>
            <Text style={styles.langName}>{targetLang.name}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />
      
      <View style={styles.settingRow}>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>Auto-detect Speaker Language</Text>
          <Text style={styles.settingSubtitle}>Automatically switch source language</Text>
        </View>
        <Switch
          value={autoDetect}
          onValueChange={handleToggleAutoDetect}
          trackColor={{ false: Colors.surfaceCard, true: Colors.secondary }}
          thumbColor={Colors.textPrimary}
        />
      </View>
    </View>
  );

  const renderAppearanceSettings = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>Dual-Language Mode</Text>
          <Text style={styles.settingSubtitle}>Show original text above translation</Text>
        </View>
        <Switch
          value={dualLanguage}
          onValueChange={handleToggleDualLanguage}
          trackColor={{ false: Colors.surfaceCard, true: Colors.secondary }}
          thumbColor={Colors.textPrimary}
        />
      </View>

      <View style={styles.divider} />
      
      <Text style={styles.subSectionTitle}>Position</Text>
      <View style={styles.optionsRow}>
        {(["top", "bottom", "floating"] as const).map((pos) => (
          <TouchableOpacity
            key={pos}
            style={[
              styles.optionButton,
              captionPosition === pos && styles.optionButtonActive
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCaptionPosition(pos);
            }}
          >
            <Text style={[
              styles.optionText,
              captionPosition === pos && styles.optionTextActive
            ]}>
              {pos.charAt(0).toUpperCase() + pos.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />
      
      <Text style={styles.subSectionTitle}>Style</Text>
      <View style={styles.optionsRow}>
        {(["subtitle", "bubble", "minimal"] as const).map((style) => (
          <TouchableOpacity
            key={style}
            style={[
              styles.optionButton,
              captionStyle === style && styles.optionButtonActive
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCaptionStyle(style);
            }}
          >
            <Text style={[
              styles.optionText,
              captionStyle === style && styles.optionTextActive
            ]}>
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />
      
      <View style={styles.sliderContainer}>
        <Text style={styles.subSectionTitle}>Font Size: {fontSize}px</Text>
        <View style={styles.sliderControls}>
          <TouchableOpacity 
            style={styles.sliderBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFontSize(Math.max(12, fontSize - 2));
            }}
          >
            <Ionicons name="remove" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${((fontSize - 12) / 16) * 100}%` }]} />
          </View>
          <TouchableOpacity 
            style={styles.sliderBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFontSize(Math.min(28, fontSize + 2));
            }}
          >
            <Ionicons name="add" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPreview = () => (
    <View style={styles.previewContainer}>
      <Text style={styles.previewTitle}>Preview</Text>
      <View style={styles.previewBox}>
        <View style={styles.previewVideoPlaceholder}>
          <Ionicons name="videocam-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.previewVideoText}>Video Call</Text>
        </View>
        
        {captionsEnabled && (
          <Animated.View 
            style={[
              styles.previewCaptionContainer,
              captionPosition === "top" ? styles.previewCaptionTop : 
              captionPosition === "bottom" ? styles.previewCaptionBottom : 
              styles.previewCaptionFloating,
              captionStyle === "bubble" ? styles.previewCaptionBubble :
              captionStyle === "minimal" ? styles.previewCaptionMinimal :
              styles.previewCaptionSubtitle,
              { opacity: fadeAnim }
            ]}
          >
            {dualLanguage && (
              <Text style={[styles.previewOriginalText, { fontSize: fontSize * 0.75 }]}>
                Hello, how are you doing today?
              </Text>
            )}
            <Text style={[styles.previewTranslatedText, { fontSize }]}>
              Hola, ¿cómo estás hoy?
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );

  const renderLanguageModal = () => (
    <Modal
      visible={showLangModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowLangModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {selectingFor === "source" ? "Source" : "Target"} Language
            </Text>
            <TouchableOpacity 
              onPress={() => setShowLangModal(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.langItem,
                  (selectingFor === "source" ? sourceLang.id : targetLang.id) === item.id && styles.langItemActive
                ]}
                onPress={() => selectLanguage(item)}
              >
                <Text style={styles.langItemFlag}>{item.flag}</Text>
                <Text style={styles.langItemName}>{item.name}</Text>
                {(selectingFor === "source" ? sourceLang.id : targetLang.id) === item.id && (
                  <Ionicons name="checkmark" size={20} color={Colors.secondary} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.langListContent}
          />
        </View>
      </View>
    </Modal>
  );

  const renderHistoryModal = () => (
    <Modal
      visible={showHistoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowHistoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContentFull}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowHistoryModal(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Caption History</Text>
            <TouchableOpacity 
              onPress={handleExportHistory}
              style={styles.modalExportBtn}
            >
              <Ionicons name="share-outline" size={24} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={MOCK_HISTORY}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <Text style={styles.historyItemSpeaker}>{item.speaker}</Text>
                  <Text style={styles.historyItemTime}>{item.time}</Text>
                </View>
                <Text style={styles.historyItemOriginal}>{item.original}</Text>
                <Text style={styles.historyItemTranslated}>{item.translated}</Text>
              </View>
            )}
            contentContainerStyle={styles.historyListContent}
            ListEmptyComponent={
              <View style={styles.emptyHistory}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyHistoryText}>No caption history yet</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-primary">
      <View style={styles.container}>
        {renderHeader()}
        
        <FlatList
          data={[{ key: "content" }]}
          keyExtractor={(item) => item.key}
          renderItem={() => (
            <View style={styles.content}>
              {renderMainToggle()}
              {renderPreview()}
              {renderLanguageSelector()}
              {renderAppearanceSettings()}
              <View style={styles.bottomPadding} />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
        
        {renderLanguageModal()}
        {renderHistoryModal()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  historyButton: {
    padding: Spacing.xs,
  },
  mainToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mainToggleTextContainer: {
    flex: 1,
  },
  mainToggleTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  mainToggleSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  subSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  langSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  langButton: {
    flex: 1,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.3)",
  },
  langLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  langValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  langFlag: {
    fontSize: FontSize.md,
    marginRight: Spacing.xs,
  },
  langName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  swapButton: {
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    borderRadius: BorderRadius.full,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  settingTitle: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  optionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionButtonActive: {
    backgroundColor: "rgba(0, 170, 255, 0.2)",
    borderColor: Colors.secondary,
  },
  optionText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  optionTextActive: {
    color: Colors.secondary,
    fontWeight: "bold",
  },
  sliderContainer: {
    marginTop: Spacing.xs,
  },
  sliderControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  sliderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: Spacing.md,
    borderRadius: 2,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
  },
  previewContainer: {
    marginBottom: Spacing.md,
  },
  previewTitle: {
    fontSize: FontSize.sm,
    fontWeight: "bold",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  previewBox: {
    height: 200,
    backgroundColor: "#000",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  previewVideoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  previewVideoText: {
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
  },
  previewCaptionContainer: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    alignItems: "center",
  },
  previewCaptionTop: {
    top: Spacing.md,
  },
  previewCaptionBottom: {
    bottom: Spacing.md,
  },
  previewCaptionFloating: {
    top: "40%",
  },
  previewCaptionSubtitle: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  previewCaptionBubble: {
    backgroundColor: "rgba(10, 22, 40, 0.85)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.3)",
  },
  previewCaptionMinimal: {
    backgroundColor: "transparent",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  previewOriginalText: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },
  previewTranslatedText: {
    color: Colors.textPrimary,
    textAlign: "center",
    fontWeight: "bold",
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: height * 0.7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalContentFull: {
    backgroundColor: Colors.primary,
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    padding: Spacing.xs,
  },
  modalExportBtn: {
    padding: Spacing.xs,
  },
  langListContent: {
    padding: Spacing.md,
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  langItemActive: {
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 0,
  },
  langItemFlag: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  langItemName: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  historyListContent: {
    padding: Spacing.md,
  },
  historyItem: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  historyItemSpeaker: {
    fontSize: FontSize.sm,
    fontWeight: "bold",
    color: Colors.secondary,
  },
  historyItemTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  historyItemOriginal: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  historyItemTranslated: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyHistoryText: {
    color: Colors.textMuted,
    marginTop: Spacing.md,
    fontSize: FontSize.md,
  },
});
