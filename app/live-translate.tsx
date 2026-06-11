import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useUsage } from "@/lib/usage-context";
import { useSubscription } from "@/hooks/use-subscription";

// Standard languages (FREE) — what Apple/Google already offer
const STANDARD_LANGUAGES = [
  { code: "en", name: "English", flag: "\u{1F1FA}\u{1F1F8}", isPremium: false },
  { code: "es", name: "Spanish", flag: "\u{1F1EA}\u{1F1F8}", isPremium: false },
  { code: "fr", name: "French", flag: "\u{1F1EB}\u{1F1F7}", isPremium: false },
  { code: "de", name: "German", flag: "\u{1F1E9}\u{1F1EA}", isPremium: false },
  { code: "ja", name: "Japanese", flag: "\u{1F1EF}\u{1F1F5}", isPremium: false },
  { code: "ko", name: "Korean", flag: "\u{1F1F0}\u{1F1F7}", isPremium: false },
  { code: "zh", name: "Mandarin", flag: "\u{1F1E8}\u{1F1F3}", isPremium: false },
  { code: "pt", name: "Portuguese", flag: "\u{1F1F5}\u{1F1F9}", isPremium: false },
  { code: "ar", name: "Arabic", flag: "\u{1F1F8}\u{1F1E6}", isPremium: false },
  { code: "hi", name: "Hindi", flag: "\u{1F1EE}\u{1F1F3}", isPremium: false },
  { code: "it", name: "Italian", flag: "\u{1F1EE}\u{1F1F9}", isPremium: false },
  { code: "ru", name: "Russian", flag: "\u{1F1F7}\u{1F1FA}", isPremium: false },
  { code: "sw", name: "Swahili", flag: "\u{1F1F0}\u{1F1EA}", isPremium: false },
  { code: "tl", name: "Tagalog", flag: "\u{1F1F5}\u{1F1ED}", isPremium: false },
  { code: "vi", name: "Vietnamese", flag: "\u{1F1FB}\u{1F1F3}", isPremium: false },
  { code: "tr", name: "Turkish", flag: "\u{1F1F9}\u{1F1F7}", isPremium: false },
  { code: "nl", name: "Dutch", flag: "\u{1F1F3}\u{1F1F1}", isPremium: false },
  { code: "pl", name: "Polish", flag: "\u{1F1F5}\u{1F1F1}", isPremium: false },
  { code: "th", name: "Thai", flag: "\u{1F1F9}\u{1F1ED}", isPremium: false },
  { code: "id", name: "Indonesian", flag: "\u{1F1EE}\u{1F1E9}", isPremium: false },
];

// Dialects & Slangs (PAID) — what competitors DON'T have
const DIALECT_LANGUAGES = [
  // Spanish Dialects — our biggest differentiator
  { code: "es-mx", name: "Mexican Spanish", flag: "\u{1F1F2}\u{1F1FD}", isPremium: true, slangNote: "Chilango, Norteno, Yucateco slang" },
  { code: "es-do", name: "Dominican Spanish", flag: "\u{1F1E9}\u{1F1F4}", isPremium: true, slangNote: "Capitale\u00F1o street slang" },
  { code: "es-pr", name: "Puerto Rican Spanish", flag: "\u{1F1F5}\u{1F1F7}", isPremium: true, slangNote: "Boricua slang, Reggaeton lingo" },
  { code: "es-cu", name: "Cuban Spanish", flag: "\u{1F1E8}\u{1F1FA}", isPremium: true, slangNote: "Habanero slang, dropped consonants" },
  { code: "es-co", name: "Colombian Spanish", flag: "\u{1F1E8}\u{1F1F4}", isPremium: true, slangNote: "Paisa, Coste\u00F1o, Rolo dialects" },
  { code: "es-ve", name: "Venezuelan Spanish", flag: "\u{1F1FB}\u{1F1EA}", isPremium: true, slangNote: "Caraque\u00F1o slang, chamo/pana" },
  { code: "es-ar", name: "Argentine Spanish", flag: "\u{1F1E6}\u{1F1F7}", isPremium: true, slangNote: "Lunfardo, voseo, Porte\u00F1o" },
  { code: "es-cl", name: "Chilean Spanish", flag: "\u{1F1E8}\u{1F1F1}", isPremium: true, slangNote: "Chilenismos, flaite slang" },
  { code: "es-pe", name: "Peruvian Spanish", flag: "\u{1F1F5}\u{1F1EA}", isPremium: true, slangNote: "Lime\u00F1o, Andean Quechua influence" },
  { code: "es-ec", name: "Ecuadorian Spanish", flag: "\u{1F1EA}\u{1F1E8}", isPremium: true, slangNote: "Sierra vs Costa dialects" },
  { code: "es-uy", name: "Uruguayan Spanish", flag: "\u{1F1FA}\u{1F1FE}", isPremium: true, slangNote: "Rioplatense, voseo" },
  { code: "es-pa", name: "Panamanian Spanish", flag: "\u{1F1F5}\u{1F1E6}", isPremium: true, slangNote: "Canal Zone creole influence" },
  { code: "es-gt", name: "Guatemalan Spanish", flag: "\u{1F1EC}\u{1F1F9}", isPremium: true, slangNote: "Mayan-influenced vocabulary" },
  { code: "es-sv", name: "Salvadoran Spanish", flag: "\u{1F1F8}\u{1F1FB}", isPremium: true, slangNote: "Caliche slang" },
  { code: "es-hn", name: "Honduran Spanish", flag: "\u{1F1ED}\u{1F1F3}", isPremium: true, slangNote: "Catracho expressions" },
  { code: "es-ni", name: "Nicaraguan Spanish", flag: "\u{1F1F3}\u{1F1EE}", isPremium: true, slangNote: "Nica slang" },
  { code: "es-bo", name: "Bolivian Spanish", flag: "\u{1F1E7}\u{1F1F4}", isPremium: true, slangNote: "Aymara/Quechua influence" },
  { code: "es-us", name: "US Latino Spanish", flag: "\u{1F1FA}\u{1F1F8}", isPremium: true, slangNote: "Spanglish, code-switching" },
  { code: "es-eq", name: "Equatorial Guinea Spanish", flag: "\u{1F1EC}\u{1F1F6}", isPremium: true, slangNote: "African Spanish dialect" },
  // Portuguese Dialects
  { code: "pt-br", name: "Brazilian Portuguese", flag: "\u{1F1E7}\u{1F1F7}", isPremium: true, slangNote: "Carioca, Paulista, Baiano, Ga\u00FAcho" },
  { code: "pt-pt", name: "European Portuguese", flag: "\u{1F1F5}\u{1F1F9}", isPremium: true, slangNote: "Lisboeta, Northern dialects" },
  { code: "pt-ao", name: "Angolan Portuguese", flag: "\u{1F1E6}\u{1F1F4}", isPremium: true, slangNote: "Luandense slang, Kimbundu mix" },
  { code: "pt-mz", name: "Mozambican Portuguese", flag: "\u{1F1F2}\u{1F1FF}", isPremium: true, slangNote: "Bantu-influenced" },
  // Arabic Dialects
  { code: "ar-eg", name: "Egyptian Arabic", flag: "\u{1F1EA}\u{1F1EC}", isPremium: true, slangNote: "Masri, Cairo street slang" },
  { code: "ar-lb", name: "Lebanese Arabic", flag: "\u{1F1F1}\u{1F1E7}", isPremium: true, slangNote: "Shami dialect, French loanwords" },
  { code: "ar-ma", name: "Moroccan Arabic", flag: "\u{1F1F2}\u{1F1E6}", isPremium: true, slangNote: "Darija, Berber influence" },
  { code: "ar-iq", name: "Iraqi Arabic", flag: "\u{1F1EE}\u{1F1F6}", isPremium: true, slangNote: "Mesopotamian dialect" },
  { code: "ar-sa", name: "Saudi Arabic", flag: "\u{1F1F8}\u{1F1E6}", isPremium: true, slangNote: "Najdi, Hejazi dialects" },
  { code: "ar-ps", name: "Palestinian Arabic", flag: "\u{1F1F5}\u{1F1F8}", isPremium: true, slangNote: "Falastini dialect" },
  // French Dialects
  { code: "fr-ca", name: "Qu\u00E9b\u00E9cois French", flag: "\u{1F1E8}\u{1F1E6}", isPremium: true, slangNote: "Joual slang, sacres" },
  { code: "fr-ht", name: "Haitian Creole", flag: "\u{1F1ED}\u{1F1F9}", isPremium: true, slangNote: "Krey\u00F2l expressions" },
  { code: "fr-sn", name: "Senegalese French", flag: "\u{1F1F8}\u{1F1F3}", isPremium: true, slangNote: "Wolof-influenced" },
  { code: "fr-ci", name: "Ivorian French", flag: "\u{1F1E8}\u{1F1EE}", isPremium: true, slangNote: "Nouchi slang" },
  { code: "fr-be", name: "Belgian French", flag: "\u{1F1E7}\u{1F1EA}", isPremium: true, slangNote: "Walloon expressions" },
  // Chinese Dialects
  { code: "zh-yue", name: "Cantonese", flag: "\u{1F1ED}\u{1F1F0}", isPremium: true, slangNote: "Hong Kong/Guangdong slang" },
  { code: "zh-tw", name: "Taiwanese Mandarin", flag: "\u{1F1F9}\u{1F1FC}", isPremium: true, slangNote: "Hokkien-influenced, local slang" },
  { code: "zh-sg", name: "Singaporean Mandarin", flag: "\u{1F1F8}\u{1F1EC}", isPremium: true, slangNote: "Singlish-influenced" },
  // Hindi/Urdu Dialects
  { code: "hi-mu", name: "Mumbai Hindi", flag: "\u{1F1EE}\u{1F1F3}", isPremium: true, slangNote: "Bambaiya, Bollywood slang" },
  { code: "hi-dl", name: "Delhi Hindi", flag: "\u{1F1EE}\u{1F1F3}", isPremium: true, slangNote: "Dilli slang, Punjabi mix" },
  { code: "ur", name: "Urdu", flag: "\u{1F1F5}\u{1F1F0}", isPremium: true, slangNote: "Formal and street Urdu" },
  // English Dialects
  { code: "en-gb", name: "British English", flag: "\u{1F1EC}\u{1F1E7}", isPremium: true, slangNote: "Cockney, MLE, Northern" },
  { code: "en-au", name: "Australian English", flag: "\u{1F1E6}\u{1F1FA}", isPremium: true, slangNote: "Aussie slang, abbreviations" },
  { code: "en-jm", name: "Jamaican Patois", flag: "\u{1F1EF}\u{1F1F2}", isPremium: true, slangNote: "Patwa, dancehall lingo" },
  { code: "en-ng", name: "Nigerian Pidgin", flag: "\u{1F1F3}\u{1F1EC}", isPremium: true, slangNote: "Naija pidgin" },
  { code: "en-za", name: "South African English", flag: "\u{1F1FF}\u{1F1E6}", isPremium: true, slangNote: "Township slang, Zulu influence" },
  { code: "en-in", name: "Indian English", flag: "\u{1F1EE}\u{1F1F3}", isPremium: true, slangNote: "Hinglish expressions" },
];

// Combined for the picker — standard shown to all, dialects shown with premium badge
const LANGUAGES = [...STANDARD_LANGUAGES, ...DIALECT_LANGUAGES];

type OutputMode = "audio" | "text" | "both";
type SessionState = "idle" | "connecting" | "active" | "error";
type VoicePreference = "natural" | "clone";

export default function LiveTranslateScreen() {
  const router = useRouter();
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Usage & subscription hooks
  const { usage, tierLimits, incrementUsage, getPercentUsed, getRemaining, isLimitReached } = useUsage();
  const { checkFeatureAccess, isPro, plan } = useSubscription();

  // State
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [sourceLang, setSourceLang] = useState(LANGUAGES[0]); // English
  const [targetLang, setTargetLang] = useState(LANGUAGES[1]); // Spanish
  const [outputMode, setOutputMode] = useState<OutputMode>("audio");
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [sourceTranscript, setSourceTranscript] = useState("");
  const [translatedTranscript, setTranslatedTranscript] = useState("");
  const [sessionDuration, setSessionDuration] = useState(0);
  const [autoDetect, setAutoDetect] = useState(true);

  // Voice selection state
  const [voicePreference, setVoicePreference] = useState<VoicePreference>("natural");
  const [voiceCloneTrained, setVoiceCloneTrained] = useState(false);

  // Conversation mode state
  const [conversationMode, setConversationMode] = useState(false);
  const [speaker2Lang, setSpeaker2Lang] = useState(LANGUAGES[0]); // Speaker 2's language
  const [showSpeaker2Picker, setShowSpeaker2Picker] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<1 | 2>(1); // which speaker is talking

  // Refs
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const peerConnectionRef = useRef<any>(null);
  const sessionStartRef = useRef<number>(0);

  // Load voice clone trained state
  useEffect(() => {
    AsyncStorage.getItem("@voice_clone_trained").then((val) => {
      setVoiceCloneTrained(val === "true");
    });
  }, []);

  // tRPC mutations
  const createSession = trpc.liveTranslate.createSession.useMutation();
  const createConversationSession = trpc.liveTranslate.createConversationSession.useMutation();
  const reportUsage = trpc.liveTranslate.reportUsage.useMutation();

  // Usage calculations
  const talkMinutesUsed = usage.talkMinutesUsed;
  const talkMinutesLimit = tierLimits.talkMinutes;
  const talkPercentUsed = getPercentUsed("talk");
  const talkRemaining = getRemaining("talk");
  const talkLimitReached = isLimitReached("talk");

  // Pulse animation for active state
  useEffect(() => {
    if (sessionState === "active") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();

      // Wave animation
      const wave = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      );
      wave.start();

      // Session timer
      sessionTimerRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);

      return () => {
        pulse.stop();
        wave.stop();
        if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      };
    }
  }, [sessionState]);

  const startTranslation = useCallback(async () => {
    // Speech-to-text (text-only output) is FREE and unlimited
    // Speech-to-speech (audio output) is PAID and uses usage minutes
    const requiresPaid = outputMode === "audio" || outputMode === "both" || conversationMode;

    if (requiresPaid && talkLimitReached) {
      Alert.alert(
        "Limit Reached",
        `You've used all ${talkMinutesLimit === -1 ? "your" : talkMinutesLimit + " minutes of"} speech-to-speech translation this month. Switch to text-only mode for free unlimited use, or upgrade your plan.`,
        [
          { text: "Use Text Mode", onPress: () => setOutputMode("text") },
          { text: "Upgrade", onPress: () => router.push("/membership" as any) },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    // Conversation mode and audio output require at least Plus plan
    if (requiresPaid && plan === "free") {
      Alert.alert(
        "Premium Feature",
        "Speech-to-speech translation, conversation mode, and dialect options are premium features. Text-only translation is free and unlimited!",
        [
          { text: "Use Text Mode (Free)", onPress: () => setOutputMode("text") },
          { text: "Upgrade", onPress: () => router.push("/membership" as any) },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    setSessionState("connecting");
    setSourceTranscript("");
    setTranslatedTranscript("");
    setSessionDuration(0);
    setLatencyMs(null);
    sessionStartRef.current = Date.now();

    try {
      if (conversationMode) {
        // Two-way conversation session
        const result = await createConversationSession.mutateAsync({
          language1: sourceLang.code,
          language2: speaker2Lang.code,
          voicePreference,
          voiceModelId: voicePreference === "clone" ? "user_cloned_voice" : undefined,
        });

        if (!result.success) {
          setSessionState("error");
          return;
        }
      } else {
        // Standard one-way session
        const result = await createSession.mutateAsync({
          targetLanguage: targetLang.code,
          sourceLanguage: autoDetect ? undefined : sourceLang.code,
          mode: "fast",
          voicePreference,
          voiceModelId: voicePreference === "clone" ? "user_cloned_voice" : undefined,
          conversationMode: false,
        });

        if (!result.success) {
          setSessionState("error");
          return;
        }
      }

      // In production, this would establish WebRTC connection
      // using the client secret to stream audio directly to OpenAI
      setSessionState("active");

      // Simulate latency measurement
      const startTime = Date.now();
      setTimeout(() => {
        setLatencyMs(Date.now() - startTime);
      }, 400);

    } catch (error) {
      console.error("[LiveTranslate] Error starting session:", error);
      setSessionState("error");
    }
  }, [targetLang, sourceLang, autoDetect, conversationMode, speaker2Lang, voicePreference, talkLimitReached]);

  const stopTranslation = useCallback(() => {
    setSessionState("idle");
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    // Close WebRTC peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Only track usage for paid features (audio output / conversation mode)
    // Speech-to-text (text-only) is FREE and doesn't consume minutes
    const durationSeconds = Math.max(1, Math.floor((Date.now() - sessionStartRef.current) / 1000));
    const minutesUsed = Math.ceil(durationSeconds / 60);
    const isPaidSession = outputMode === "audio" || outputMode === "both" || conversationMode;
    if (isPaidSession) {
      // Conversation mode counts as 2x (two simultaneous sessions)
      const effectiveMinutes = conversationMode ? minutesUsed * 2 : minutesUsed;
      incrementUsage("talk", effectiveMinutes);
    }

    // Report to server for analytics
    reportUsage.mutate({
      durationSeconds,
      targetLanguage: targetLang.code,
      voicePreference,
      conversationMode,
    });
  }, [conversationMode, targetLang, voicePreference]);

  const swapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  const handleVoicePreferenceChange = (pref: VoicePreference) => {
    if (pref === "clone") {
      if (!checkFeatureAccess("voice_cloning")) {
        Alert.alert(
          "Pro Feature",
          "Voice cloning output requires a Pro subscription. Upgrade to hear translations in your own voice.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Upgrade to Pro", onPress: () => router.push("/membership" as any) },
          ]
        );
        return;
      }
      if (!voiceCloneTrained) {
        Alert.alert(
          "Voice Not Trained",
          "You need to train your voice model first before using cloned voice output.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Train Voice", onPress: () => router.push("/voice-clone-training" as any) },
          ]
        );
        return;
      }
    }
    setVoicePreference(pref);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getUsageBarColor = () => {
    if (talkPercentUsed >= 90) return "#EF4444";
    if (talkPercentUsed >= 75) return "#F59E0B";
    return colors.primary;
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Live Translate
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              Speech-to-Speech {conversationMode ? "• Conversation" : "• Real-time"}
            </Text>
          </View>
          {latencyMs !== null && sessionState === "active" && (
            <View style={[styles.latencyBadge, { backgroundColor: latencyMs < 800 ? "#22C55E20" : "#F59E0B20" }]}>
              <View style={[styles.latencyDot, { backgroundColor: latencyMs < 800 ? "#22C55E" : "#F59E0B" }]} />
              <Text style={[styles.latencyText, { color: latencyMs < 800 ? "#22C55E" : "#F59E0B" }]}>
                {latencyMs}ms
              </Text>
            </View>
          )}
        </View>

        {/* Usage Meter */}
        <View style={[styles.usageMeter, { backgroundColor: colors.surface }]}>
          <View style={styles.usageMeterHeader}>
            <View style={styles.usageMeterLeft}>
              <Ionicons name="time-outline" size={16} color={colors.muted} />
              <Text style={[styles.usageMeterLabel, { color: colors.muted }]}>
                This Month
              </Text>
            </View>
            <Text style={[styles.usageMeterValue, { color: colors.foreground }]}>
              {talkMinutesUsed} / {talkMinutesLimit === -1 ? "\u221E" : `${talkMinutesLimit} min`}
            </Text>
          </View>
          <View style={[styles.usageBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.usageBarFill,
                {
                  backgroundColor: getUsageBarColor(),
                  width: `${Math.min(talkPercentUsed, 100)}%`,
                },
              ]}
            />
          </View>
          {talkPercentUsed >= 80 && talkMinutesLimit !== -1 && (
            <View style={styles.usageWarning}>
              <Ionicons name="warning" size={12} color="#F59E0B" />
              <Text style={[styles.usageWarningText, { color: "#F59E0B" }]}>
                {talkRemaining <= 0
                  ? "Limit reached — upgrade for more minutes"
                  : `${talkRemaining} min remaining`}
              </Text>
            </View>
          )}
          {talkMinutesLimit === -1 && (
            <Text style={[styles.usageUnlimited, { color: colors.primary }]}>
              Unlimited (Pro)
            </Text>
          )}
        </View>

        {/* Speed Comparison Banner */}
        {sessionState === "idle" && (
          <View style={[styles.speedBanner, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="flash" size={18} color={colors.primary} />
            <Text style={[styles.speedText, { color: colors.primary }]}>
              10x faster than Apple Translate — hear it, don't read it
            </Text>
          </View>
        )}

        {/* Language Selector */}
        <View style={[styles.langSection, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.langCard, { backgroundColor: colors.background }]}
            onPress={() => setShowSourcePicker(!showSourcePicker)}
            disabled={sessionState === "active"}
          >
            <Text style={styles.langFlag}>{sourceLang.flag}</Text>
            <View>
              <Text style={[styles.langLabel, { color: colors.muted }]}>
                {conversationMode ? "Speaker 1" : "I speak"}
              </Text>
              <Text style={[styles.langName, { color: colors.foreground }]}>{sourceLang.name}</Text>
            </View>
            {autoDetect && !conversationMode && (
              <View style={[styles.autoTag, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.autoTagText, { color: colors.primary }]}>Auto</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={swapLanguages} style={styles.swapButton} disabled={sessionState === "active"}>
            <Ionicons name="swap-horizontal" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langCard, { backgroundColor: colors.background }]}
            onPress={() => conversationMode ? setShowSpeaker2Picker(!showSpeaker2Picker) : setShowTargetPicker(!showTargetPicker)}
            disabled={sessionState === "active"}
          >
            <Text style={styles.langFlag}>{conversationMode ? speaker2Lang.flag : targetLang.flag}</Text>
            <View>
              <Text style={[styles.langLabel, { color: colors.muted }]}>
                {conversationMode ? "Speaker 2" : "Translate to"}
              </Text>
              <Text style={[styles.langName, { color: colors.foreground }]}>
                {conversationMode ? speaker2Lang.name : targetLang.name}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Language Pickers */}
        {showSourcePicker && (
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
            <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
              <Text style={[styles.pickerSectionHeader, { color: colors.muted }]}>Standard Languages (Free)</Text>
              {STANDARD_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.pickerItem, sourceLang.code === lang.code && { backgroundColor: colors.primary + "15" }]}
                  onPress={() => { setSourceLang(lang); setShowSourcePicker(false); }}
                >
                  <Text style={styles.pickerFlag}>{lang.flag}</Text>
                  <Text style={[styles.pickerName, { color: colors.foreground }]}>{lang.name}</Text>
                  {sourceLang.code === lang.code && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
              <Text style={[styles.pickerSectionHeader, { color: colors.primary }]}>Dialects & Slangs (Premium)</Text>
              {DIALECT_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.pickerItem, sourceLang.code === lang.code && { backgroundColor: colors.primary + "15" }]}
                  onPress={() => {
                    if (plan === "free") {
                      Alert.alert("Premium Dialects", `${lang.name} with ${(lang as any).slangNote} is a premium feature. Upgrade to access all dialects and slangs!`, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Upgrade", onPress: () => router.push("/membership" as any) },
                      ]);
                      return;
                    }
                    setSourceLang(lang); setShowSourcePicker(false);
                  }}
                >
                  <Text style={styles.pickerFlag}>{lang.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerName, { color: colors.foreground }]}>{lang.name}</Text>
                    {(lang as any).slangNote && <Text style={[styles.pickerSlangNote, { color: colors.muted }]}>{(lang as any).slangNote}</Text>}
                  </View>
                  {plan === "free" ? (
                    <Ionicons name="lock-closed" size={14} color={colors.muted} />
                  ) : sourceLang.code === lang.code ? (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {showTargetPicker && (
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
            <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
              <Text style={[styles.pickerSectionHeader, { color: colors.muted }]}>Standard Languages (Free)</Text>
              {STANDARD_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.pickerItem, targetLang.code === lang.code && { backgroundColor: colors.primary + "15" }]}
                  onPress={() => { setTargetLang(lang); setShowTargetPicker(false); }}
                >
                  <Text style={styles.pickerFlag}>{lang.flag}</Text>
                  <Text style={[styles.pickerName, { color: colors.foreground }]}>{lang.name}</Text>
                  {targetLang.code === lang.code && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
              <Text style={[styles.pickerSectionHeader, { color: colors.primary }]}>Dialects & Slangs (Premium)</Text>
              {DIALECT_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.pickerItem, targetLang.code === lang.code && { backgroundColor: colors.primary + "15" }]}
                  onPress={() => {
                    if (plan === "free") {
                      Alert.alert("Premium Dialects", `${lang.name} with ${(lang as any).slangNote} is a premium feature. Upgrade to access all dialects and slangs!`, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Upgrade", onPress: () => router.push("/membership" as any) },
                      ]);
                      return;
                    }
                    setTargetLang(lang); setShowTargetPicker(false);
                  }}
                >
                  <Text style={styles.pickerFlag}>{lang.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerName, { color: colors.foreground }]}>{lang.name}</Text>
                    {(lang as any).slangNote && <Text style={[styles.pickerSlangNote, { color: colors.muted }]}>{(lang as any).slangNote}</Text>}
                  </View>
                  {plan === "free" ? (
                    <Ionicons name="lock-closed" size={14} color={colors.muted} />
                  ) : targetLang.code === lang.code ? (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {showSpeaker2Picker && (
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
            <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
              <Text style={[styles.pickerSectionHeader, { color: colors.muted }]}>Standard Languages</Text>
              {STANDARD_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.pickerItem, speaker2Lang.code === lang.code && { backgroundColor: colors.primary + "15" }]}
                  onPress={() => { setSpeaker2Lang(lang); setShowSpeaker2Picker(false); }}
                >
                  <Text style={styles.pickerFlag}>{lang.flag}</Text>
                  <Text style={[styles.pickerName, { color: colors.foreground }]}>{lang.name}</Text>
                  {speaker2Lang.code === lang.code && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
              <Text style={[styles.pickerSectionHeader, { color: colors.primary }]}>Dialects & Slangs (Premium)</Text>
              {DIALECT_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.pickerItem, speaker2Lang.code === lang.code && { backgroundColor: colors.primary + "15" }]}
                  onPress={() => {
                    if (plan === "free") {
                      Alert.alert("Premium Dialects", `${lang.name} with ${(lang as any).slangNote} is a premium feature.`, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Upgrade", onPress: () => router.push("/membership" as any) },
                      ]);
                      return;
                    }
                    setSpeaker2Lang(lang); setShowSpeaker2Picker(false);
                  }}
                >
                  <Text style={styles.pickerFlag}>{lang.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerName, { color: colors.foreground }]}>{lang.name}</Text>
                    {(lang as any).slangNote && <Text style={[styles.pickerSlangNote, { color: colors.muted }]}>{(lang as any).slangNote}</Text>}
                  </View>
                  {plan === "free" ? (
                    <Ionicons name="lock-closed" size={14} color={colors.muted} />
                  ) : speaker2Lang.code === lang.code ? (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Output Mode Toggle */}
        <View style={[styles.outputSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Output Mode</Text>
          <View style={styles.outputModes}>
            {([
              { key: "audio", icon: "volume-high", label: "Hear It" },
              { key: "text", icon: "text", label: "Read It" },
              { key: "both", icon: "layers", label: "Both" },
            ] as const).map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.outputModeCard,
                  { backgroundColor: colors.background, borderColor: outputMode === mode.key ? colors.primary : colors.border },
                  outputMode === mode.key && { borderWidth: 2 },
                ]}
                onPress={() => setOutputMode(mode.key)}
              >
                <Ionicons
                  name={mode.icon as any}
                  size={24}
                  color={outputMode === mode.key ? colors.primary : colors.muted}
                />
                <Text style={[
                  styles.outputModeLabel,
                  { color: outputMode === mode.key ? colors.primary : colors.muted },
                ]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voice Selection */}
        <View style={[styles.voiceSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Voice Output</Text>
          <View style={styles.voiceOptions}>
            <TouchableOpacity
              style={[
                styles.voiceCard,
                {
                  backgroundColor: colors.background,
                  borderColor: voicePreference === "natural" ? colors.primary : colors.border,
                  borderWidth: voicePreference === "natural" ? 2 : 1,
                },
              ]}
              onPress={() => handleVoicePreferenceChange("natural")}
            >
              <Ionicons
                name="mic"
                size={22}
                color={voicePreference === "natural" ? colors.primary : colors.muted}
              />
              <View style={styles.voiceCardText}>
                <Text style={[styles.voiceCardTitle, { color: voicePreference === "natural" ? colors.primary : colors.foreground }]}>
                  Natural AI Voice
                </Text>
                <Text style={[styles.voiceCardDesc, { color: colors.muted }]}>
                  High-quality AI voice
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.voiceCard,
                {
                  backgroundColor: colors.background,
                  borderColor: voicePreference === "clone" ? colors.primary : colors.border,
                  borderWidth: voicePreference === "clone" ? 2 : 1,
                },
              ]}
              onPress={() => handleVoicePreferenceChange("clone")}
            >
              <Ionicons
                name="person"
                size={22}
                color={voicePreference === "clone" ? colors.primary : colors.muted}
              />
              <View style={styles.voiceCardText}>
                <Text style={[styles.voiceCardTitle, { color: voicePreference === "clone" ? colors.primary : colors.foreground }]}>
                  My Cloned Voice
                </Text>
                <Text style={[styles.voiceCardDesc, { color: colors.muted }]}>
                  {voiceCloneTrained ? "Trained" : "Not trained yet"}
                </Text>
              </View>
              {!isPro && (
                <View style={[styles.proBadge, { backgroundColor: "#8B5CF620" }]}>
                  <Text style={[styles.proBadgeText, { color: "#8B5CF6" }]}>PRO</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Conversation Mode Toggle */}
        <View style={[styles.conversationSection, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.conversationCard,
              {
                backgroundColor: conversationMode ? colors.primary + "10" : colors.background,
                borderColor: conversationMode ? colors.primary : colors.border,
                borderWidth: conversationMode ? 2 : 1,
              },
            ]}
            onPress={() => {
              if (!conversationMode && plan === "free") {
                Alert.alert(
                  "Plus Feature",
                  "Two-way conversation mode requires a Plus or Pro subscription.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Upgrade", onPress: () => router.push("/membership" as any) },
                  ]
                );
                return;
              }
              setConversationMode(!conversationMode);
            }}
          >
            <View style={[styles.conversationIcon, { backgroundColor: conversationMode ? colors.primary + "20" : colors.border + "40" }]}>
              <Ionicons name="people" size={24} color={conversationMode ? colors.primary : colors.muted} />
            </View>
            <View style={styles.conversationText}>
              <Text style={[styles.conversationTitle, { color: conversationMode ? colors.primary : colors.foreground }]}>
                Conversation Mode
              </Text>
              <Text style={[styles.conversationDesc, { color: colors.muted }]}>
                Two speakers, real-time back-and-forth translation
              </Text>
            </View>
            <View style={[styles.toggleTrack, { backgroundColor: conversationMode ? colors.primary : colors.border }]}>
              <View style={[styles.toggleThumb, conversationMode && styles.toggleThumbActive]} />
            </View>
            {plan === "free" && (
              <View style={[styles.plusBadge, { backgroundColor: "#3B82F620" }]}>
                <Text style={[styles.plusBadgeText, { color: "#3B82F6" }]}>PLUS</Text>
              </View>
            )}
          </TouchableOpacity>

          {conversationMode && sessionState === "idle" && (
            <View style={[styles.conversationHint, { backgroundColor: colors.primary + "08" }]}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={[styles.conversationHintText, { color: colors.muted }]}>
                Both speakers hold the phone. Tap the speaker toggle during the session to switch who is talking.
              </Text>
            </View>
          )}
        </View>

        {/* Active Session Display */}
        {sessionState === "active" && (
          <View style={[styles.activeSession, { backgroundColor: colors.surface }]}>
            {/* Session Timer */}
            <View style={styles.timerRow}>
              <View style={[styles.liveDot, { backgroundColor: "#EF4444" }]} />
              <Text style={[styles.timerText, { color: colors.foreground }]}>
                LIVE {conversationMode ? "CONVERSATION" : ""} \u2022 {formatDuration(sessionDuration)}
              </Text>
            </View>

            {/* Conversation Mode Speaker Indicator */}
            {conversationMode && (
              <View style={styles.speakerToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.speakerButton,
                    {
                      backgroundColor: activeSpeaker === 1 ? colors.primary : colors.background,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setActiveSpeaker(1)}
                >
                  <Ionicons name="person" size={16} color={activeSpeaker === 1 ? "#FFFFFF" : colors.primary} />
                  <Text style={[styles.speakerButtonText, { color: activeSpeaker === 1 ? "#FFFFFF" : colors.primary }]}>
                    {sourceLang.flag} Speaker 1
                  </Text>
                </TouchableOpacity>
                <Ionicons name="swap-horizontal" size={18} color={colors.muted} />
                <TouchableOpacity
                  style={[
                    styles.speakerButton,
                    {
                      backgroundColor: activeSpeaker === 2 ? colors.primary : colors.background,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setActiveSpeaker(2)}
                >
                  <Ionicons name="person" size={16} color={activeSpeaker === 2 ? "#FFFFFF" : colors.primary} />
                  <Text style={[styles.speakerButtonText, { color: activeSpeaker === 2 ? "#FFFFFF" : colors.primary }]}>
                    {speaker2Lang.flag} Speaker 2
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Audio Waveform Visualization */}
            <View style={styles.waveformContainer}>
              <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary, opacity: waveAnim }]} />
              {[0.6, 0.8, 1, 0.9, 0.7, 0.5, 0.8, 1, 0.6, 0.4].map((height, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      backgroundColor: colors.primary,
                      height: 20 * height,
                      opacity: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.9],
                      }),
                    },
                  ]}
                />
              ))}
            </View>

            {/* Transcript Display (if text mode enabled) */}
            {(outputMode === "text" || outputMode === "both") && (
              <View style={styles.transcriptSection}>
                <View style={[styles.transcriptBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.transcriptLabel, { color: colors.muted }]}>
                    {sourceLang.flag} Original
                  </Text>
                  <Text style={[styles.transcriptText, { color: colors.foreground }]}>
                    {sourceTranscript || "Listening..."}
                  </Text>
                </View>
                <Ionicons name="arrow-down" size={16} color={colors.muted} style={{ alignSelf: "center", marginVertical: 4 }} />
                <View style={[styles.transcriptBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                  <Text style={[styles.transcriptLabel, { color: colors.primary }]}>
                    {conversationMode ? speaker2Lang.flag : targetLang.flag} Translation
                  </Text>
                  <Text style={[styles.transcriptText, { color: colors.foreground }]}>
                    {translatedTranscript || "Translating..."}
                  </Text>
                </View>
              </View>
            )}

            {/* Audio-only feedback */}
            {outputMode === "audio" && (
              <View style={styles.audioFeedback}>
                <Ionicons name="volume-high" size={32} color={colors.primary} />
                <Text style={[styles.audioFeedbackText, { color: colors.muted }]}>
                  Translation playing through speaker
                </Text>
                <Text style={[styles.audioFeedbackSub, { color: colors.muted }]}>
                  {voicePreference === "clone" ? "Using your cloned voice" : "Original audio muted to avoid confusion"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Error State */}
        {sessionState === "error" && (
          <View style={[styles.errorCard, { backgroundColor: "#EF444410" }]}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={[styles.errorText, { color: "#EF4444" }]}>
              Connection failed. Check your internet and try again.
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: "#EF4444" }]}
              onPress={startTranslation}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* How It Works (idle state) */}
        {sessionState === "idle" && (
          <View style={[styles.howItWorks, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How It Works</Text>
            <View style={styles.stepsList}>
              {[
                { icon: "mic", text: "You speak naturally in your language" },
                { icon: "flash", text: "AI translates in real-time (<1 second)" },
                { icon: "volume-high", text: "Hear the translation spoken back instantly" },
                { icon: "document-text", text: "Optional: see text transcript alongside" },
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepIcon, { backgroundColor: colors.primary + "15" }]}>
                    <Ionicons name={step.icon as any} size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.stepText, { color: colors.foreground }]}>{step.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Main Action Button */}
      <View style={[styles.actionContainer, { backgroundColor: colors.background }]}>
        {sessionState === "idle" || sessionState === "error" ? (
          <TouchableOpacity
            style={[
              styles.startButton,
              { backgroundColor: talkLimitReached ? colors.muted : colors.primary },
            ]}
            onPress={startTranslation}
          >
            <Ionicons name={conversationMode ? "people" : "mic"} size={28} color="#FFFFFF" />
            <Text style={styles.startButtonText}>
              {talkLimitReached
                ? "Limit Reached"
                : conversationMode
                ? "Start Conversation"
                : "Start Live Translation"}
            </Text>
          </TouchableOpacity>
        ) : sessionState === "connecting" ? (
          <View style={[styles.connectingButton, { backgroundColor: colors.primary + "80" }]}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.startButtonText}>Connecting...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.stopButton, { backgroundColor: "#EF4444" }]}
            onPress={stopTranslation}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="stop" size={28} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.startButtonText}>Stop Translation</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  latencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  latencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  latencyText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Usage Meter
  usageMeter: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  usageMeterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  usageMeterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  usageMeterLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  usageMeterValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  usageBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  usageBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  usageWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  usageWarningText: {
    fontSize: 11,
    fontWeight: "500",
  },
  usageUnlimited: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  speedBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  speedText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  langSection: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  langCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  langFlag: {
    fontSize: 24,
  },
  langLabel: {
    fontSize: 11,
  },
  langName: {
    fontSize: 14,
    fontWeight: "600",
  },
  autoTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: "auto",
  },
  autoTagText: {
    fontSize: 10,
    fontWeight: "700",
  },
  swapButton: {
    padding: 8,
  },
  pickerContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  pickerFlag: {
    fontSize: 20,
  },
  pickerName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  pickerSectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  pickerSlangNote: {
    fontSize: 11,
    marginTop: 2,
  },
  outputSection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  outputModes: {
    flexDirection: "row",
    gap: 10,
  },
  outputModeCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  outputModeLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Voice Selection
  voiceSection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  voiceOptions: {
    flexDirection: "row",
    gap: 10,
  },
  voiceCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  voiceCardText: {
    flex: 1,
  },
  voiceCardTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  voiceCardDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  proBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  // Conversation Mode
  conversationSection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  conversationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  conversationText: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  conversationDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  plusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  plusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  conversationHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  conversationHintText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  // Active Session
  activeSession: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  speakerToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },
  speakerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  speakerButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    gap: 3,
    marginBottom: 16,
  },
  waveBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  transcriptSection: {
    gap: 4,
  },
  transcriptBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  transcriptLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 15,
    lineHeight: 22,
  },
  audioFeedback: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  audioFeedbackText: {
    fontSize: 14,
    fontWeight: "500",
  },
  audioFeedbackSub: {
    fontSize: 12,
  },
  errorCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  howItWorks: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  stepsList: {
    gap: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    fontSize: 14,
    flex: 1,
  },
  actionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  connectingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
