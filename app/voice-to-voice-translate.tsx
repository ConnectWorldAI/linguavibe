import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useHumeTranslator, type TranslationSegment } from "@/hooks/use-hume-translator";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Languages for voice-to-voice
const LANGUAGES = [
  { code: "en", name: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "es", name: "Spanish", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "es-do", name: "Dominican Spanish", flag: "\u{1F1E9}\u{1F1F4}" },
  { code: "fr", name: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "de", name: "German", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "ja", name: "Japanese", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "ko", name: "Korean", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "zh", name: "Mandarin", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "pt", name: "Portuguese", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "it", name: "Italian", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "ar", name: "Arabic", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "hi", name: "Hindi", flag: "\u{1F1EE}\u{1F1F3}" },
];

type ConversationMode = "continuous" | "push-to-talk";
type Speaker = "user" | "other";

interface ConversationTurn {
  id: string;
  speaker: Speaker;
  originalText: string;
  translatedText: string;
  emotion: string | null;
  timestamp: number;
  language: string;
}

export default function VoiceToVoiceTranslateScreen() {
  // Language state
  const [userLang, setUserLang] = useState(LANGUAGES[0]); // English
  const [otherLang, setOtherLang] = useState(LANGUAGES[1]); // Spanish
  const [showLangPicker, setShowLangPicker] = useState<"user" | "other" | null>(null);

  // Conversation state
  const [mode, setMode] = useState<ConversationMode>("continuous");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<Speaker | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);

  // Voice clone state
  const [useVoiceClone, setUseVoiceClone] = useState(false);
  const [voiceId, setVoiceModelId] = useState<string | null>(null);
  const [voiceCloneTrained, setVoiceCloneTrained] = useState(false);

  // Load voice clone settings on mount
  useEffect(() => {
    (async () => {
      const trained = await AsyncStorage.getItem("@voice_clone_trained");
      const modelId = await AsyncStorage.getItem("@voice_clone_model_id");
      if (trained === "true" && modelId) {
        setVoiceCloneTrained(true);
        setVoiceModelId(modelId);
        setUseVoiceClone(true); // Default to using clone if trained
      }
    })();
  }, []);

  // Synthesize TTS with voice clone via server
  const synthesizeWithClone = useCallback(async (text: string, language: string) => {
    if (useVoiceClone && voiceId) {
      try {
        // Use the TTS mutation with voice model ID
        await ttsMutation.mutateAsync({
          text,
          language,
          voiceId: voiceId,
        });
        return true;
      } catch {
        // Fallback to device TTS
        return false;
      }
    }
    return false;
  }, [useVoiceClone, voiceId, ttsMutation]);

  // Speech-to-text
  const speechToText = useSpeechToText();

  // Hume translator (bidirectional)
  const translator = useHumeTranslator({
    sourceLanguage: userLang.code,
    targetLanguage: otherLang.code,
    mode: "conversation",
    voicePreference: "natural",
    secondLanguage: otherLang.code,
  });

  // TTS mutation for speaking translations
  const ttsMutation = trpc.translate.tts.useMutation();

  // Auto-language detection mutation
  const detectLangMutation = trpc.translate.detectLanguage.useMutation();

  // Detect language from transcript and update language state
  const autoDetect = useCallback(async (text: string, speaker: Speaker) => {
    if (!autoDetectLanguage || text.length < 3) return;
    try {
      const result = await detectLangMutation.mutateAsync({ text });
      if (result.success && result.confidence >= 70) {
        const detected = LANGUAGES.find(
          (l) => l.code === result.code || l.code.startsWith(result.code)
        );
        if (detected) {
          if (speaker === "user" && detected.code !== userLang.code) {
            setUserLang(detected);
          } else if (speaker === "other" && detected.code !== otherLang.code) {
            setOtherLang(detected);
          }
        }
      }
    } catch {
      // Silently fail - auto-detect is best-effort
    }
  }, [autoDetectLanguage, userLang, otherLang, detectLangMutation]);

  // Animated values for waveform visualization
  const waveScale1 = useSharedValue(1);
  const waveScale2 = useSharedValue(1);
  const waveScale3 = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  // Scroll ref for auto-scrolling conversation
  const scrollRef = useRef<ScrollView>(null);

  // Start waveform animation when listening
  useEffect(() => {
    if (activeSpeaker) {
      waveScale1.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      waveScale2.value = withRepeat(
        withSequence(
          withTiming(1.8, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      waveScale3.value = withRepeat(
        withSequence(
          withTiming(2.0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      waveScale1.value = withTiming(1, { duration: 200 });
      waveScale2.value = withTiming(1, { duration: 200 });
      waveScale3.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0.3, { duration: 200 });
    }
  }, [activeSpeaker]);

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale1.value }],
  }));
  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale2.value }],
  }));
  const wave3Style = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale3.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Start a conversation session
  const startSession = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSessionActive(true);
    setConversationHistory([]);

    try {
      await translator.startSession();
    } catch (error) {
      console.error("Failed to start translator session:", error);
    }
  }, [translator]);

  // End the conversation session
  const endSession = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSessionActive(false);
    setActiveSpeaker(null);

    try {
      await translator.stopSession();
    } catch (error) {
      console.error("Failed to stop session:", error);
    }
  }, [translator]);

  // Handle user speaking (push-to-talk or continuous)
  const handleUserSpeak = useCallback(async () => {
    if (!isSessionActive) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveSpeaker("user");

    try {
      await speechToText.startRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
      setActiveSpeaker(null);
    }
  }, [isSessionActive, speechToText]);

  // Handle user stop speaking
  const handleUserStopSpeak = useCallback(async () => {
    if (!activeSpeaker) return;

    try {
      const transcript = await speechToText.stopRecording();

      if (transcript && transcript.trim()) {
        // Auto-detect language from what the user said
        autoDetect(transcript, "user");

        // Translate the text
        const translateResult = await ttsMutation.mutateAsync({
          text: transcript,
          language: otherLang.code,
        });

        // Add to conversation
        const turn: ConversationTurn = {
          id: `turn-${Date.now()}`,
          speaker: "user",
          originalText: transcript,
          translatedText: transcript, // We'll get translation from the translator
          emotion: translator.session.speakerEmotion,
          timestamp: Date.now(),
          language: userLang.code,
        };

        // Use the translator to get actual translation
        translator.addSegment({
          originalText: transcript,
          translatedText: "", // Will be filled by translator
          emotion: translator.session.speakerEmotion,
          confidence: 0.9,
          speakerTone: "neutral",
        });

        setConversationHistory((prev) => [...prev, turn]);

        // Speak the translation in target language using TTS (voice clone or device TTS)
        if (Platform.OS !== "web") {
          const usedClone = await synthesizeWithClone(transcript, otherLang.code);
          if (!usedClone) {
            Speech.speak(transcript, {
              language: otherLang.code,
              rate: 0.9,
              pitch: 1.0,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to process speech:", error);
    } finally {
      setActiveSpeaker(null);
    }
  }, [activeSpeaker, speechToText, translator, otherLang, userLang, ttsMutation]);

  // Handle other person speaking
  const handleOtherSpeak = useCallback(async () => {
    if (!isSessionActive) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveSpeaker("other");

    try {
      await speechToText.startRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
      setActiveSpeaker(null);
    }
  }, [isSessionActive, speechToText]);

  // Handle other person stop speaking
  const handleOtherStopSpeak = useCallback(async () => {
    if (!activeSpeaker) return;

    try {
      const transcript = await speechToText.stopRecording();

      if (transcript && transcript.trim()) {
        // Auto-detect language from what the other person said
        autoDetect(transcript, "other");

        const turn: ConversationTurn = {
          id: `turn-${Date.now()}`,
          speaker: "other",
          originalText: transcript,
          translatedText: transcript,
          emotion: translator.session.speakerEmotion,
          timestamp: Date.now(),
          language: otherLang.code,
        };

        translator.addSegment({
          originalText: transcript,
          translatedText: "",
          emotion: translator.session.speakerEmotion,
          confidence: 0.9,
          speakerTone: "neutral",
        });

        setConversationHistory((prev) => [...prev, turn]);

        // Speak translation in user's language (voice clone or device TTS)
        if (Platform.OS !== "web") {
          const usedClone = await synthesizeWithClone(transcript, userLang.code);
          if (!usedClone) {
            Speech.speak(transcript, {
              language: userLang.code,
              rate: 0.9,
              pitch: 1.0,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to process speech:", error);
    } finally {
      setActiveSpeaker(null);
    }
  }, [activeSpeaker, speechToText, translator, userLang, otherLang]);

  // Swap languages
  const swapLanguages = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const temp = userLang;
    setUserLang(otherLang);
    setOtherLang(temp);
  }, [userLang, otherLang]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && conversationHistory.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversationHistory.length]);

  // Render language picker modal
  const renderLanguagePicker = () => {
    if (!showLangPicker) return null;

    return (
      <View style={styles.langPickerOverlay}>
        <View style={styles.langPickerContainer}>
          <View style={styles.langPickerHeader}>
            <Text style={styles.langPickerTitle}>
              {showLangPicker === "user" ? "Your Language" : "Their Language"}
            </Text>
            <TouchableOpacity onPress={() => setShowLangPicker(null)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.langPickerItem,
                  (showLangPicker === "user" ? userLang : otherLang).code === item.code &&
                    styles.langPickerItemActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (showLangPicker === "user") {
                    setUserLang(item);
                  } else {
                    setOtherLang(item);
                  }
                  setShowLangPicker(null);
                }}
              >
                <Text style={styles.langPickerFlag}>{item.flag}</Text>
                <Text style={styles.langPickerName}>{item.name}</Text>
                {(showLangPicker === "user" ? userLang : otherLang).code === item.code && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (isSessionActive) {
              endSession();
            }
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice-to-Voice</Text>
        <View style={styles.headerRight}>
          {isSessionActive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{translator.formattedDuration}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Language Selector Bar */}
      <View style={styles.langBar}>
        <TouchableOpacity
          style={styles.langSelector}
          onPress={() => setShowLangPicker("user")}
        >
          <Text style={styles.langFlag}>{userLang.flag}</Text>
          <Text style={styles.langName}>{userLang.name}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
          <Ionicons name="swap-horizontal" size={20} color={Colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.langSelector}
          onPress={() => setShowLangPicker("other")}
        >
          <Text style={styles.langFlag}>{otherLang.flag}</Text>
          <Text style={styles.langName}>{otherLang.name}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Auto-Detect Toggle */}
      <View style={styles.autoDetectRow}>
        <Ionicons name="sparkles" size={16} color={autoDetectLanguage ? Colors.secondary : Colors.textMuted} />
        <Text style={[styles.autoDetectText, autoDetectLanguage && { color: Colors.secondary }]}>
          Auto-Detect Language
        </Text>
        <TouchableOpacity
          style={[styles.autoDetectToggle, autoDetectLanguage && styles.autoDetectToggleActive]}
          onPress={() => {
            setAutoDetectLanguage(!autoDetectLanguage);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={[styles.autoDetectDot, autoDetectLanguage && styles.autoDetectDotActive]} />
        </TouchableOpacity>
      </View>

      {/* Voice Clone Toggle */}
      <View style={styles.autoDetectRow}>
        <Ionicons name="person-circle" size={16} color={useVoiceClone ? Colors.accent : Colors.textMuted} />
        <Text style={[styles.autoDetectText, useVoiceClone && { color: Colors.accent }]}>
          {voiceCloneTrained ? "Use My Voice" : "Voice Clone (Train First)"}
        </Text>
        <TouchableOpacity
          style={[styles.autoDetectToggle, useVoiceClone && { backgroundColor: Colors.accent }]}
          onPress={() => {
            if (!voiceCloneTrained) {
              router.push("/voice-clone-training" as any);
              return;
            }
            setUseVoiceClone(!useVoiceClone);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={[styles.autoDetectDot, useVoiceClone && styles.autoDetectDotActive]} />
        </TouchableOpacity>
      </View>

      {/* Conversation History */}
      <ScrollView
        ref={scrollRef}
        style={styles.conversationArea}
        contentContainerStyle={styles.conversationContent}
      >
        {conversationHistory.length === 0 && isSessionActive && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Conversation Started</Text>
            <Text style={styles.emptySubtitle}>
              Press and hold a microphone button to speak.{"\n"}
              Your speech will be translated and spoken aloud.
            </Text>
          </View>
        )}

        {!isSessionActive && conversationHistory.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="mic-outline" size={64} color={Colors.secondary} />
            <Text style={styles.emptyTitle}>Voice-to-Voice Translation</Text>
            <Text style={styles.emptySubtitle}>
              Have a real-time conversation in two languages.{"\n"}
              Speak naturally and hear instant translations.
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="flash" size={16} color={Colors.gold} />
                <Text style={styles.featureText}>Real-time speech-to-speech</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="globe" size={16} color={Colors.secondary} />
                <Text style={styles.featureText}>12+ languages with dialects</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="happy" size={16} color={Colors.success} />
                <Text style={styles.featureText}>Emotion-aware translation</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="volume-high" size={16} color={Colors.accent} />
                <Text style={styles.featureText}>Auto-speaks translations</Text>
              </View>
            </View>
          </View>
        )}

        {conversationHistory.map((turn) => (
          <View
            key={turn.id}
            style={[
              styles.turnBubble,
              turn.speaker === "user" ? styles.userBubble : styles.otherBubble,
            ]}
          >
            <View style={styles.turnHeader}>
              <Text style={styles.turnSpeaker}>
                {turn.speaker === "user" ? `You (${userLang.flag})` : `Them (${otherLang.flag})`}
              </Text>
              {turn.emotion && (
                <Text style={styles.turnEmotion}>{turn.emotion}</Text>
              )}
            </View>
            <Text style={styles.turnOriginal}>{turn.originalText}</Text>
            {turn.translatedText !== turn.originalText && (
              <Text style={styles.turnTranslated}>{turn.translatedText}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Waveform Visualization */}
      {activeSpeaker && (
        <View style={styles.waveformContainer}>
          <Animated.View style={[styles.waveCircle, styles.waveCircle3, wave3Style]} />
          <Animated.View style={[styles.waveCircle, styles.waveCircle2, wave2Style]} />
          <Animated.View style={[styles.waveCircle, styles.waveCircle1, wave1Style]} />
          <Animated.View style={[styles.wavePulse, pulseStyle]}>
            <Ionicons
              name="mic"
              size={24}
              color={activeSpeaker === "user" ? Colors.secondary : Colors.gold}
            />
          </Animated.View>
          <Text style={styles.waveLabel}>
            {activeSpeaker === "user" ? "You're speaking..." : "They're speaking..."}
          </Text>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {!isSessionActive ? (
          // Start session button
          <TouchableOpacity style={styles.startButton} onPress={startSession}>
            <Ionicons name="mic" size={28} color="#FFF" />
            <Text style={styles.startButtonText}>Start Conversation</Text>
          </TouchableOpacity>
        ) : (
          // Active session controls
          <View style={styles.activeControls}>
            {/* User mic (left side) */}
            <View style={styles.micSection}>
              <Text style={styles.micLabel}>{userLang.flag} You</Text>
              <TouchableOpacity
                style={[
                  styles.micButton,
                  styles.userMicButton,
                  activeSpeaker === "user" && styles.micButtonActive,
                ]}
                onPressIn={handleUserSpeak}
                onPressOut={handleUserStopSpeak}
                disabled={activeSpeaker === "other"}
              >
                <Ionicons
                  name={activeSpeaker === "user" ? "mic" : "mic-outline"}
                  size={32}
                  color={activeSpeaker === "user" ? "#FFF" : Colors.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* End session button (center) */}
            <TouchableOpacity style={styles.endButton} onPress={endSession}>
              <Ionicons name="stop" size={20} color="#FFF" />
            </TouchableOpacity>

            {/* Other person mic (right side) */}
            <View style={styles.micSection}>
              <Text style={styles.micLabel}>{otherLang.flag} Them</Text>
              <TouchableOpacity
                style={[
                  styles.micButton,
                  styles.otherMicButton,
                  activeSpeaker === "other" && styles.micButtonActiveGold,
                ]}
                onPressIn={handleOtherSpeak}
                onPressOut={handleOtherStopSpeak}
                disabled={activeSpeaker === "user"}
              >
                <Ionicons
                  name={activeSpeaker === "other" ? "mic" : "mic-outline"}
                  size={32}
                  color={activeSpeaker === "other" ? "#FFF" : Colors.gold}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Mode toggle */}
        {isSessionActive && (
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeChip, mode === "push-to-talk" && styles.modeChipActive]}
              onPress={() => {
                setMode("push-to-talk");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons name="hand-left" size={14} color={mode === "push-to-talk" ? "#FFF" : Colors.textSecondary} />
              <Text style={[styles.modeChipText, mode === "push-to-talk" && styles.modeChipTextActive]}>
                Push to Talk
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeChip, mode === "continuous" && styles.modeChipActive]}
              onPress={() => {
                setMode("continuous");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons name="infinite" size={14} color={mode === "continuous" ? "#FFF" : Colors.textSecondary} />
              <Text style={[styles.modeChipText, mode === "continuous" && styles.modeChipTextActive]}>
                Continuous
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Language Picker Overlay */}
      {renderLanguagePicker()}
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 80,
    alignItems: "flex-end",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 45, 45, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 45, 45, 0.3)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  liveText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: "700",
  },
  // Language bar
  langBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 12,
  },
  langSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
  },
  langFlag: {
    fontSize: 18,
  },
  langName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  autoDetectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  autoDetectText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  autoDetectToggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  autoDetectToggleActive: {
    backgroundColor: Colors.secondary,
  },
  autoDetectDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFF",
  },
  autoDetectDotActive: {
    alignSelf: "flex-end",
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  // Conversation area
  conversationArea: {
    flex: 1,
  },
  conversationContent: {
    padding: Spacing.lg,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  featureList: {
    marginTop: 20,
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  // Conversation bubbles
  turnBubble: {
    maxWidth: "85%",
    padding: 14,
    borderRadius: BorderRadius.lg,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 184, 0, 0.08)",
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  turnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  turnSpeaker: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  turnEmotion: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  turnOriginal: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  turnTranslated: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    marginTop: 6,
    fontStyle: "italic",
  },
  // Waveform
  waveformContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  waveCircle: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 1,
  },
  waveCircle1: {
    width: 60,
    height: 60,
    borderColor: Colors.glowBorder,
  },
  waveCircle2: {
    width: 80,
    height: 80,
    borderColor: "rgba(0, 170, 255, 0.2)",
  },
  waveCircle3: {
    width: 100,
    height: 100,
    borderColor: "rgba(0, 170, 255, 0.1)",
  },
  wavePulse: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  waveLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  // Bottom controls
  bottomControls: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === "ios" ? 34 : Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: "#FFF",
  },
  activeControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  micSection: {
    alignItems: "center",
    gap: 8,
  },
  micLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  userMicButton: {
    borderColor: Colors.secondary,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
  },
  otherMicButton: {
    borderColor: Colors.gold,
    backgroundColor: "rgba(255, 184, 0, 0.08)",
  },
  micButtonActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  micButtonActiveGold: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  endButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  // Mode toggle
  modeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: Spacing.md,
  },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  modeChipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  modeChipTextActive: {
    color: "#FFF",
  },
  // Language picker overlay
  langPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  langPickerContainer: {
    width: "100%",
    maxHeight: "70%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  langPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  langPickerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  langPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  langPickerItemActive: {
    backgroundColor: "rgba(0, 170, 255, 0.08)",
  },
  langPickerFlag: {
    fontSize: 24,
  },
  langPickerName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
});
