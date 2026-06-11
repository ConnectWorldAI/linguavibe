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
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

// Mock Data
const LANGUAGES = [
  { id: "en", name: "English", flag: "🇺🇸" },
  { id: "es", name: "Spanish", flag: "🇪🇸" },
  { id: "fr", name: "French", flag: "🇫🇷" },
  { id: "de", name: "German", flag: "🇩🇪" },
  { id: "it", name: "Italian", flag: "🇮🇹" },
  { id: "ja", name: "Japanese", flag: "🇯🇵" },
  { id: "ko", name: "Korean", flag: "🇰🇷" },
  { id: "zh", name: "Chinese", flag: "🇨🇳" },
];

const MOCK_HISTORY = [
  {
    id: "1",
    sourceLang: "en",
    targetLang: "es",
    date: "2026-05-28T10:30:00Z",
    duration: 12,
    quality: 98,
  },
  {
    id: "2",
    sourceLang: "en",
    targetLang: "fr",
    date: "2026-05-27T14:15:00Z",
    duration: 24,
    quality: 95,
  },
  {
    id: "3",
    sourceLang: "en",
    targetLang: "ja",
    date: "2026-05-25T09:45:00Z",
    duration: 8,
    quality: 92,
  },
];

export default function VoiceCloneTranslationScreen() {
  const [sourceLang, setSourceLang] = useState(LANGUAGES[0]);
  const [targetLang, setTargetLang] = useState(LANGUAGES[1]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [hasVoiceSample, setHasVoiceSample] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useInCalls, setUseInCalls] = useState(false);
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [showLangPicker, setShowLangPicker] = useState<"source" | "target" | null>(null);
  const [voiceQuality, setVoiceQuality] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedUseInCalls = await AsyncStorage.getItem("voiceClone_useInCalls");
      if (savedUseInCalls !== null) {
        setUseInCalls(savedUseInCalls === "true");
      }
      const savedHasSample = await AsyncStorage.getItem("voiceClone_hasSample");
      if (savedHasSample === "true") {
        setHasVoiceSample(true);
        setVoiceQuality(96);
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    }
  };

  const saveUseInCalls = async (value: boolean) => {
    try {
      await AsyncStorage.setItem("voiceClone_useInCalls", value.toString());
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  };

  const toggleUseInCalls = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newValue = !useInCalls;
    setUseInCalls(newValue);
    saveUseInCalls(newValue);
  };

  const startRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRecording(true);
    setRecordingProgress(0);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    let progress = 0;
    progressInterval.current = setInterval(() => {
      progress += 100 / 30; // 30 seconds max
      if (progress >= 100) {
        stopRecording();
      } else {
        setRecordingProgress(progress);
      }
    }, 1000);
  };

  const stopRecording = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRecording(false);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    setHasVoiceSample(true);
    setVoiceQuality(Math.floor(Math.random() * 10) + 90); // 90-99%
    
    try {
      await AsyncStorage.setItem("voiceClone_hasSample", "true");
    } catch (error) {
      console.error("Failed to save sample state", error);
    }
    
    Alert.alert(
      "Voice Cloned Successfully",
      "Your voice identity has been captured and is ready for translation.",
      [{ text: "Awesome", style: "default" }]
    );
  };

  const togglePlayback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    }
  };

  const renderHistoryItem = ({ item }: { item: typeof MOCK_HISTORY[0] }) => {
    const source = LANGUAGES.find((l) => l.id === item.sourceLang);
    const target = LANGUAGES.find((l) => l.id === item.targetLang);
    
    return (
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View style={styles.langPair}>
            <Text style={styles.historyFlag}>{source?.flag}</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} style={styles.historyArrow} />
            <Text style={styles.historyFlag}>{target?.flag}</Text>
          </View>
          <Text style={styles.historyDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.historyDetails}>
          <View style={styles.historyStat}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.historyStatText}>{item.duration}s</Text>
          </View>
          <View style={styles.historyStat}>
            <Ionicons name="star" size={14} color={Colors.gold} />
            <Text style={styles.historyStatText}>{item.quality}% Match</Text>
          </View>
          <TouchableOpacity style={styles.playSmallBtn}>
            <Ionicons name="play" size={16} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLanguagePicker = () => {
    if (!showLangPicker) return null;
    
    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>
              Select {showLangPicker === "source" ? "Source" : "Target"} Language
            </Text>
            <TouchableOpacity 
              onPress={() => setShowLangPicker(null)}
              style={styles.closePickerBtn}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.langOption}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (showLangPicker === "source") {
                    setSourceLang(item);
                  } else {
                    setTargetLang(item);
                  }
                  setShowLangPicker(null);
                }}
              >
                <Text style={styles.langOptionFlag}>{item.flag}</Text>
                <Text style={styles.langOptionName}>{item.name}</Text>
                {((showLangPicker === "source" && sourceLang.id === item.id) ||
                  (showLangPicker === "target" && targetLang.id === item.id)) && (
                  <Ionicons name="checkmark" size={24} color={Colors.secondary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <>
      {/* Language Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Translation Pair</Text>
        <View style={styles.langSelectorContainer}>
          <TouchableOpacity 
            style={styles.langSelector}
            onPress={() => setShowLangPicker("source")}
          >
            <Text style={styles.langLabel}>Source</Text>
            <View style={styles.langValue}>
              <Text style={styles.langFlag}>{sourceLang.flag}</Text>
              <Text style={styles.langName}>{sourceLang.name}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.swapIconContainer}>
            <Ionicons name="swap-horizontal" size={24} color={Colors.secondary} />
          </View>
          
          <TouchableOpacity 
            style={styles.langSelector}
            onPress={() => setShowLangPicker("target")}
          >
            <Text style={styles.langLabel}>Target</Text>
            <View style={styles.langValue}>
              <Text style={styles.langFlag}>{targetLang.flag}</Text>
              <Text style={styles.langName}>{targetLang.name}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Voice Recording / Cloning */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice Identity</Text>
        <View style={styles.recordCard}>
          <Text style={styles.recordInstruction}>
            {hasVoiceSample 
              ? "Your voice identity is captured and ready." 
              : "Read the text below to clone your voice (30s)"}
          </Text>
          
          {!hasVoiceSample && (
            <View style={styles.promptBox}>
              <Text style={styles.promptText}>
                "The quick brown fox jumps over the lazy dog. I am recording my voice to create a digital clone that sounds exactly like me, preserving my unique tone and emotion."
              </Text>
            </View>
          )}

          <View style={styles.recordControls}>
            <TouchableOpacity 
              style={[styles.recordButton, isRecording && styles.recordingActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Animated.View style={[
                styles.recordInner, 
                { transform: [{ scale: isRecording ? pulseAnim : 1 }] }
              ]}>
                <Ionicons 
                  name={isRecording ? "stop" : "mic"} 
                  size={32} 
                  color={Colors.textPrimary} 
                />
              </Animated.View>
            </TouchableOpacity>
            
            {isRecording && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${recordingProgress}%` }]} />
              </View>
            )}
          </View>

          {hasVoiceSample && (
            <View style={styles.qualityContainer}>
              <View style={styles.qualityHeader}>
                <Text style={styles.qualityLabel}>Voice Match Quality</Text>
                <Text style={styles.qualityValue}>{voiceQuality}%</Text>
              </View>
              <View style={styles.qualityBarBg}>
                <View style={[styles.qualityBarFill, { width: `${voiceQuality}%` }]} />
              </View>
              
              <View style={styles.previewActions}>
                <TouchableOpacity 
                  style={styles.previewBtn}
                  onPress={togglePlayback}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={20} 
                    color={Colors.primary} 
                  />
                  <Text style={styles.previewBtnText}>
                    {isPlaying ? "Playing..." : `Preview in ${targetLang.name}`}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.retakeBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setHasVoiceSample(false);
                  }}
                >
                  <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Use in Live Calls</Text>
            <Text style={styles.settingDesc}>
              Automatically translate your voice during calls
            </Text>
          </View>
          <Switch
            value={useInCalls}
            onValueChange={toggleUseInCalls}
            trackColor={{ false: Colors.surfaceCard, true: Colors.secondary }}
            thumbColor={Colors.textPrimary}
            disabled={!hasVoiceSample}
          />
        </View>
      </View>

      {/* History Header */}
      <View style={styles.historyHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Translations</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-primary">
      <View style={styles.container}>
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
          <Text style={styles.headerTitle}>Voice Clone</Text>
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={12} color={Colors.primary} />
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        </View>

        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={renderHeader}
          renderItem={renderHistoryItem}
          ListFooterComponent={<View style={styles.bottomPadding} />}
        />
        
        {renderLanguagePicker()}
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
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  premiumText: {
    fontSize: FontSize.xs,
    fontWeight: "bold",
    color: Colors.primary,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  langSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langSelector: {
    flex: 1,
  },
  langLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  langValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  langFlag: {
    fontSize: FontSize.lg,
  },
  langName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  swapIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.sm,
  },
  recordCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  recordInstruction: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  promptBox: {
    backgroundColor: "rgba(0, 170, 255, 0.05)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    marginBottom: Spacing.lg,
  },
  promptText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontStyle: "italic",
    lineHeight: 24,
  },
  recordControls: {
    alignItems: "center",
    width: "100%",
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 59, 48, 0.3)",
  },
  recordingActive: {
    borderColor: "#FF3B30",
    backgroundColor: "rgba(255, 59, 48, 0.2)",
  },
  recordInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  progressContainer: {
    width: "100%",
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: Spacing.lg,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FF3B30",
  },
  qualityContainer: {
    width: "100%",
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  qualityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  qualityLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  qualityValue: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.success,
  },
  qualityBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  qualityBarFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  previewActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  previewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  previewBtnText: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.primary,
  },
  retakeBtn: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  settingTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  historyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "500",
  },
  historyCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  langPair: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  historyFlag: {
    fontSize: FontSize.lg,
  },
  historyArrow: {
    marginHorizontal: 4,
  },
  historyDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  historyDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  historyStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyStatText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  playSmallBtn: {
    marginLeft: "auto",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 8, 16, 0.8)",
    justifyContent: "flex-end",
  },
  pickerContainer: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  closePickerBtn: {
    padding: Spacing.xs,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  langOptionFlag: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  langOptionName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  bottomPadding: {
    height: 40,
  },
});
