import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Switch,
  Alert,
  Modal,
  TextInput,
  Animated,
  PanResponder,
  Dimensions,
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const { width, height } = Dimensions.get("window");

// Mock Data
const MOCK_LANGUAGES = [
  { id: "en", name: "English" },
  { id: "es", name: "Spanish" },
  { id: "fr", name: "French" },
  { id: "de", name: "German" },
  { id: "ja", name: "Japanese" },
  { id: "ko", name: "Korean" },
  { id: "zh", name: "Chinese" },
];

const MOCK_HISTORY = [
  {
    id: "1",
    sourceText: "Hello, how are you?",
    translatedText: "Hola, ¿cómo estás?",
    sourceLang: "en",
    targetLang: "es",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "2",
    sourceText: "Where is the train station?",
    translatedText: "Où est la gare?",
    sourceLang: "en",
    targetLang: "fr",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "3",
    sourceText: "I would like to order food.",
    translatedText: "食べ物を注文したいです。",
    sourceLang: "en",
    targetLang: "ja",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export default function ScreenOverlayTranslate() {
  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedText, setCapturedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [showLangModal, setShowLangModal] = useState(false);
  const [selectingLangType, setSelectingLangType] = useState<"source" | "target">("source");

  // Draggable Bubble State
  const pan = useRef(new Animated.ValueXY({ x: width - 80, y: height / 2 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        // Snap to edges
        Animated.spring(pan, {
          toValue: {
            x: (pan.x as any)._value > width / 2 ? width - 80 : 20,
            y: Math.max(100, Math.min((pan.y as any)._value, height - 100)),
          },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSource = await AsyncStorage.getItem("overlay_source_lang");
      const savedTarget = await AsyncStorage.getItem("overlay_target_lang");
      if (savedSource) setSourceLang(savedSource);
      if (savedTarget) setTargetLang(savedTarget);
    } catch (error) {
      console.error("Failed to load settings", error);
    }
  };

  const saveSettings = async (source: string, target: string) => {
    try {
      await AsyncStorage.setItem("overlay_source_lang", source);
      await AsyncStorage.setItem("overlay_target_lang", target);
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  };

  const toggleOverlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOverlayActive(!isOverlayActive);
    if (isOverlayActive) {
      setIsExpanded(false);
    }
  };

  const toggleExpanded = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  const simulateCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCapturing(true);
    
    // Simulate OCR delay
    setTimeout(() => {
      const mockCaptured = "This is a simulated captured text from the screen.";
      setCapturedText(mockCaptured);
      
      // Simulate Translation delay
      setTimeout(() => {
        const mockTranslated = "Este es un texto capturado simulado de la pantalla.";
        setTranslatedText(mockTranslated);
        setIsCapturing(false);
        
        // Add to history
        const newHistoryItem = {
          id: Date.now().toString(),
          sourceText: mockCaptured,
          translatedText: mockTranslated,
          sourceLang,
          targetLang,
          timestamp: new Date().toISOString(),
        };
        setHistory([newHistoryItem, ...history]);
      }, 1000);
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Clipboard.setString(text);
    Alert.alert("Copied", "Text copied to clipboard");
  };

  const openLangSelector = (type: "source" | "target") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectingLangType(type);
    setShowLangModal(true);
  };

  const selectLanguage = (langId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectingLangType === "source") {
      setSourceLang(langId);
      saveSettings(langId, targetLang);
    } else {
      setTargetLang(langId);
      saveSettings(sourceLang, langId);
    }
    setShowLangModal(false);
  };

  const swapLanguages = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    saveSettings(targetLang, temp);
  };

  const getLangName = (id: string) => {
    return MOCK_LANGUAGES.find((l) => l.id === id)?.name || id;
  };

  const renderHistoryItem = ({ item }: { item: typeof MOCK_HISTORY[0] }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyLangText}>
          {getLangName(item.sourceLang)} → {getLangName(item.targetLang)}
        </Text>
        <Text style={styles.historyTimeText}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={styles.historySourceText}>{item.sourceText}</Text>
      <View style={styles.historyDivider} />
      <Text style={styles.historyTranslatedText}>{item.translatedText}</Text>
      <TouchableOpacity
        style={styles.copyButton}
        onPress={() => copyToClipboard(item.translatedText)}
      >
        <Ionicons name="copy-outline" size={16} color={Colors.secondary} />
        <Text style={styles.copyButtonText}>Copy</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLangItem = ({ item }: { item: typeof MOCK_LANGUAGES[0] }) => {
    const isSelected =
      selectingLangType === "source" ? item.id === sourceLang : item.id === targetLang;

    return (
      <TouchableOpacity
        style={[styles.langItem, isSelected && styles.langItemSelected]}
        onPress={() => selectLanguage(item.id)}
      >
        <Text style={[styles.langItemText, isSelected && styles.langItemTextSelected]}>
          {item.name}
        </Text>
        {isSelected && <Ionicons name="checkmark" size={24} color={Colors.secondary} />}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Screen Translation</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Activation Card */}
        <View style={styles.activationCard}>
          <View style={styles.activationHeader}>
            <View>
              <Text style={styles.activationTitle}>Overlay Mode</Text>
              <Text style={styles.activationSubtitle}>Translate any app on screen</Text>
            </View>
            <Switch
              value={isOverlayActive}
              onValueChange={toggleOverlay}
              trackColor={{ false: Colors.surfaceCard, true: Colors.secondary }}
              thumbColor={Colors.textPrimary}
            />
          </View>
          
          {isOverlayActive && (
            <View style={styles.activeStatusContainer}>
              <View style={styles.activeDot} />
              <Text style={styles.activeStatusText}>Overlay is active</Text>
            </View>
          )}
        </View>

        {/* Language Selection */}
        <View style={styles.langSelectorContainer}>
          <TouchableOpacity
            style={styles.langSelectorButton}
            onPress={() => openLangSelector("source")}
          >
            <Text style={styles.langSelectorLabel}>From</Text>
            <Text style={styles.langSelectorValue}>{getLangName(sourceLang)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
            <Ionicons name="swap-horizontal" size={24} color={Colors.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.langSelectorButton}
            onPress={() => openLangSelector("target")}
          >
            <Text style={styles.langSelectorLabel}>To</Text>
            <Text style={styles.langSelectorValue}>{getLangName(targetLang)}</Text>
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Translations</Text>
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderHistoryItem}
            contentContainerStyle={styles.historyList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      {/* Floating Overlay Simulation */}
      {isOverlayActive && (
        <Animated.View
          style={[
            styles.floatingOverlay,
            isExpanded ? styles.floatingOverlayExpanded : styles.floatingOverlayMini,
            { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
          ]}
          {...panResponder.panHandlers}
        >
          {!isExpanded ? (
            <TouchableOpacity style={styles.miniBubble} onPress={toggleExpanded}>
              <Ionicons name="scan" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.expandedBubble}>
              <View style={styles.expandedHeader}>
                <Text style={styles.expandedTitle}>Translate Screen</Text>
                <TouchableOpacity onPress={toggleExpanded}>
                  <Ionicons name="close" size={24} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.expandedContent}>
                {isCapturing ? (
                  <View style={styles.capturingContainer}>
                    <Ionicons name="scan-outline" size={40} color={Colors.secondary} style={styles.scanIcon} />
                    <Text style={styles.capturingText}>Scanning screen...</Text>
                  </View>
                ) : translatedText ? (
                  <View style={styles.resultContainer}>
                    <Text style={styles.resultSourceText}>{capturedText}</Text>
                    <View style={styles.resultDivider} />
                    <Text style={styles.resultTranslatedText}>{translatedText}</Text>
                    <View style={styles.resultActions}>
                      <TouchableOpacity
                        style={styles.resultActionButton}
                        onPress={() => copyToClipboard(translatedText)}
                      >
                        <Ionicons name="copy" size={20} color={Colors.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.resultActionButton}
                        onPress={() => {
                          setCapturedText("");
                          setTranslatedText("");
                        }}
                      >
                        <Ionicons name="refresh" size={20} color={Colors.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.captureButton} onPress={simulateCapture}>
                    <Ionicons name="camera" size={32} color={Colors.textPrimary} />
                    <Text style={styles.captureButtonText}>Capture Text</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* Language Selection Modal */}
      <Modal visible={showLangModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {selectingLangType === "source" ? "Source" : "Target"} Language
              </Text>
              <TouchableOpacity onPress={() => setShowLangModal(false)}>
                <Ionicons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={MOCK_LANGUAGES}
              keyExtractor={(item) => item.id}
              renderItem={renderLangItem}
              contentContainerStyle={styles.langList}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  activationCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activationTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  activationSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  activeStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: Spacing.sm,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  activeStatusText: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: "600",
  },
  langSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langSelectorButton: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.sm,
  },
  langSelectorLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  langSelectorValue: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  swapButton: {
    padding: Spacing.sm,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    borderRadius: BorderRadius.full,
  },
  historySection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  historyList: {
    paddingBottom: Spacing.xxl,
  },
  historyCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  historyLangText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "600",
  },
  historyTimeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  historySourceText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  historyDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  historyTranslatedText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    padding: Spacing.xs,
  },
  copyButtonText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    marginLeft: Spacing.xs,
  },
  floatingOverlay: {
    position: "absolute",
    zIndex: 1000,
    elevation: 10,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingOverlayMini: {
    width: 60,
    height: 60,
  },
  floatingOverlayExpanded: {
    width: width * 0.85,
    minHeight: 250,
  },
  miniBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.glow,
  },
  expandedBubble: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.secondary,
    overflow: "hidden",
  },
  expandedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  expandedTitle: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  expandedContent: {
    padding: Spacing.lg,
    minHeight: 200,
    justifyContent: "center",
  },
  captureButton: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  captureButtonText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: "bold",
    marginTop: Spacing.xs,
  },
  capturingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  scanIcon: {
    marginBottom: Spacing.md,
  },
  capturingText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: "600",
  },
  resultContainer: {
    flex: 1,
  },
  resultSourceText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  resultDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  resultTranslatedText: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: "bold",
    marginBottom: Spacing.lg,
  },
  resultActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
  },
  resultActionButton: {
    padding: Spacing.sm,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    borderRadius: BorderRadius.full,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(4, 8, 16, 0.9)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: height * 0.7,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  langList: {
    padding: Spacing.md,
  },
  langItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  langItemSelected: {
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  langItemText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  langItemTextSelected: {
    color: Colors.textPrimary,
    fontWeight: "bold",
  },
});
