import { Alert } from "react-native";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

// Mock Data
const MOCK_HISTORY = [
  {
    id: "1",
    text: "Bonjour, comment allez-vous aujourd'hui?",
    language: "French",
    code: "fr",
    flag: "🇫🇷",
    confidence: 98,
    register: "Formal",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "2",
    text: "What's up man, long time no see!",
    language: "English",
    code: "en",
    flag: "🇺🇸",
    confidence: 95,
    register: "Slang",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "3",
    text: "La estructura molecular del compuesto es compleja.",
    language: "Spanish",
    code: "es",
    flag: "🇪🇸",
    confidence: 92,
    register: "Academic",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const REGISTER_COLORS = {
  Formal: Colors.secondary,
  Informal: Colors.success,
  Slang: Colors.warning,
  Academic: Colors.glow,
};

export default function AutoLanguageDetectScreen() {
  const [inputText, setInputText] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLang, setDetectedLang] = useState<any>(null);
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings state
  const [autoSwitchMode, setAutoSwitchMode] = useState(true);
  const [highSensitivity, setHighSensitivity] = useState(false);
  const [detectDialects, setDetectDialects] = useState(true);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const meterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (isDetecting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isDetecting]);

  useEffect(() => {
    if (detectedLang) {
      Animated.timing(meterAnim, {
        toValue: detectedLang.confidence,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      meterAnim.setValue(0);
    }
  }, [detectedLang]);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem("langDetectSettings");
      if (settings) {
        const parsed = JSON.parse(settings);
        setAutoSwitchMode(parsed.autoSwitchMode ?? true);
        setHighSensitivity(parsed.highSensitivity ?? false);
        setDetectDialects(parsed.detectDialects ?? true);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(
        "langDetectSettings",
        JSON.stringify({
          autoSwitchMode,
          highSensitivity,
          detectDialects,
        })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSettings(false);
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  };

  const handleDetect = () => {
    if (!inputText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDetecting(true);
    setDetectedLang(null);

    // Simulate API call
    setTimeout(() => {
      setIsDetecting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Mock detection logic based on input length/content
      const newDetection = {
        id: Date.now().toString(),
        text: inputText,
        language: inputText.includes("hola") ? "Spanish" : inputText.includes("bonjour") ? "French" : "English",
        code: inputText.includes("hola") ? "es" : inputText.includes("bonjour") ? "fr" : "en",
        flag: inputText.includes("hola") ? "🇪🇸" : inputText.includes("bonjour") ? "🇫🇷" : "🇺🇸",
        confidence: Math.floor(Math.random() * 15) + 85, // 85-99
        register: inputText.length > 50 ? "Academic" : inputText.includes("yo") ? "Slang" : "Informal",
        timestamp: new Date().toISOString(),
      };

      setDetectedLang(newDetection);
      setHistory((prev) => [newDetection, ...prev]);
    }, 1500);
  };

  const clearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all detection history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setHistory([]);
          }
        }
      ]
    );
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <View style={styles.historyLangRow}>
          <Text style={styles.historyFlag}>{item.flag}</Text>
          <Text style={styles.historyLang}>{item.language}</Text>
          <View style={[styles.registerBadge, { borderColor: REGISTER_COLORS[item.register as keyof typeof REGISTER_COLORS] }]}>
            <Text style={[styles.registerText, { color: REGISTER_COLORS[item.register as keyof typeof REGISTER_COLORS] }]}>
              {item.register}
            </Text>
          </View>
        </View>
        <Text style={styles.historyConfidence}>{item.confidence}%</Text>
      </View>
      <Text style={styles.historyText} numberOfLines={2}>{item.text}</Text>
      <Text style={styles.historyTime}>
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-primary">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="chevron-back" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Auto Detect</Text>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSettings(true);
            }}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <KeyboardAvoidingView 
          style={styles.content} 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type or paste text to detect language..."
              placeholderTextColor={Colors.textMuted}
              multiline
              value={inputText}
              onChangeText={setInputText}
              maxLength={500}
            />
            <View style={styles.inputFooter}>
              <Text style={styles.charCount}>{inputText.length}/500</Text>
              <TouchableOpacity 
                style={[styles.detectButton, !inputText.trim() && styles.detectButtonDisabled]}
                onPress={handleDetect}
                disabled={!inputText.trim() || isDetecting}
              >
                {isDetecting ? (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="scan-outline" size={20} color={Colors.primary} />
                  </Animated.View>
                ) : (
                  <Text style={styles.detectButtonText}>Detect</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Detection Result */}
          {detectedLang && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Detected Language</Text>
                <View style={styles.resultFlagContainer}>
                  <Text style={styles.resultFlag}>{detectedLang.flag}</Text>
                  <Text style={styles.resultLangName}>{detectedLang.language}</Text>
                </View>
              </View>

              {/* Confidence Meter */}
              <View style={styles.meterContainer}>
                <View style={styles.meterHeader}>
                  <Text style={styles.meterLabel}>Confidence</Text>
                  <Text style={styles.meterValue}>{detectedLang.confidence}%</Text>
                </View>
                <View style={styles.meterTrack}>
                  <Animated.View 
                    style={[
                      styles.meterFill, 
                      { 
                        width: meterAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%']
                        }) 
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* Register Info */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerLabel}>Formality Register</Text>
                <View style={styles.registerRow}>
                  <Ionicons 
                    name={
                      detectedLang.register === 'Formal' ? 'business' : 
                      detectedLang.register === 'Academic' ? 'school' : 
                      detectedLang.register === 'Slang' ? 'flame' : 'chatbubbles'
                    } 
                    size={20} 
                    color={REGISTER_COLORS[detectedLang.register as keyof typeof REGISTER_COLORS]} 
                  />
                  <Text style={[styles.registerValue, { color: REGISTER_COLORS[detectedLang.register as keyof typeof REGISTER_COLORS] }]}>
                    {detectedLang.register}
                  </Text>
                </View>
              </View>

              {/* Auto-switch indicator */}
              {autoSwitchMode && (
                <View style={styles.autoSwitchIndicator}>
                  <Ionicons name="swap-horizontal" size={16} color={Colors.secondary} />
                  <Text style={styles.autoSwitchText}>
                    Translation mode switched to {detectedLang.register}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* History List */}
          <View style={styles.historySection}>
            <View style={styles.historySectionHeader}>
              <Text style={styles.historySectionTitle}>Recent Detections</Text>
              {history.length > 0 && (
                <TouchableOpacity onPress={clearHistory}>
                  <Text style={styles.clearHistoryText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={renderHistoryItem}
              contentContainerStyle={styles.historyList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
                  <Text style={styles.emptyStateText}>No detection history yet</Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>

        {/* Settings Modal */}
        <Modal
          visible={showSettings}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detection Settings</Text>
                <TouchableOpacity 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowSettings(false);
                  }}
                >
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Auto-Switch Mode</Text>
                  <Text style={styles.settingDesc}>Automatically adjust translation style based on detected register</Text>
                </View>
                <Switch
                  value={autoSwitchMode}
                  onValueChange={(val) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAutoSwitchMode(val);
                  }}
                  trackColor={{ false: Colors.surfaceCard, true: Colors.secondary }}
                  thumbColor={Colors.textPrimary}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>High Sensitivity</Text>
                  <Text style={styles.settingDesc}>Detect language from shorter text snippets (may reduce accuracy)</Text>
                </View>
                <Switch
                  value={highSensitivity}
                  onValueChange={(val) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setHighSensitivity(val);
                  }}
                  trackColor={{ false: Colors.surfaceCard, true: Colors.secondary }}
                  thumbColor={Colors.textPrimary}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Detect Dialects</Text>
                  <Text style={styles.settingDesc}>Attempt to identify specific regional dialects</Text>
                </View>
                <Switch
                  value={detectDialects}
                  onValueChange={(val) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDetectDialects(val);
                  }}
                  trackColor={{ false: Colors.surfaceCard, true: Colors.secondary }}
                  thumbColor={Colors.textPrimary}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconButton: {
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
  },
  inputContainer: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  textInput: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  detectButton: {
    backgroundColor: Colors.glow,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minWidth: 100,
    alignItems: "center",
  },
  detectButtonDisabled: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detectButtonText: {
    color: Colors.primary,
    fontWeight: "bold",
    fontSize: FontSize.md,
  },
  resultCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glow,
    marginBottom: Spacing.lg,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  resultTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resultFlagContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  resultFlag: {
    fontSize: 24,
  },
  resultLangName: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: "bold",
  },
  meterContainer: {
    marginBottom: Spacing.md,
  },
  meterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  meterLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  meterValue: {
    color: Colors.glow,
    fontSize: FontSize.sm,
    fontWeight: "bold",
  },
  meterTrack: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  meterFill: {
    height: "100%",
    backgroundColor: Colors.glow,
    borderRadius: BorderRadius.full,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  registerLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  registerValue: {
    fontSize: FontSize.md,
    fontWeight: "bold",
  },
  autoSwitchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  autoSwitchText: {
    color: Colors.secondary,
    fontSize: FontSize.sm,
  },
  historySection: {
    flex: 1,
  },
  historySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  historySectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: "bold",
  },
  clearHistoryText: {
    color: Colors.error,
    fontSize: FontSize.sm,
  },
  historyList: {
    paddingBottom: Spacing.xl,
  },
  historyCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  historyLangRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  historyFlag: {
    fontSize: 16,
  },
  historyLang: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: "bold",
  },
  registerBadge: {
    borderWidth: 1,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  registerText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  historyConfidence: {
    color: Colors.glow,
    fontSize: FontSize.sm,
    fontWeight: "bold",
  },
  historyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  historyTime: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(4, 8, 16, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: "bold",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  settingInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  settingTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: "bold",
    marginBottom: 4,
  },
  settingDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  saveButton: {
    backgroundColor: Colors.glow,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  saveButtonText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: "bold",
  },
});
