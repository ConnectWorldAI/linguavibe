import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useUsage } from "@/lib/usage-context";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "es-do", name: "Dominican Spanish", flag: "🇩🇴" },
  { code: "es-mx", name: "Mexican Spanish", flag: "🇲🇽" },
  { code: "es-co", name: "Colombian Spanish", flag: "🇨🇴" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Mandarin", flag: "🇨🇳" },
  { code: "pt-br", name: "Brazilian Portuguese", flag: "🇧🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "tl", name: "Tagalog", flag: "🇵🇭" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
];

const COMPATIBLE_APPS = [
  { name: "Phone Calls", icon: "call", available: true },
  { name: "FaceTime", icon: "videocam", available: true },
  { name: "WhatsApp", icon: "logo-whatsapp", available: true },
  { name: "Instagram", icon: "logo-instagram", available: true },
  { name: "Facebook", icon: "logo-facebook", available: true },
  { name: "Zoom", icon: "desktop", available: true },
  { name: "Teams", icon: "people", available: true },
  { name: "Google Meet", icon: "logo-google", available: true },
  { name: "Discord", icon: "chatbubbles", available: true },
  { name: "Telegram", icon: "paper-plane", available: true },
];

type TranslationMode = "fast" | "study";
type AudioOutput = "speaker" | "earbud" | "text";

export default function CallTranslatorScreen() {
  const router = useRouter();
  const { usage, tierLimits, incrementUsage, getPercentUsed, getRemaining, isLimitReached } = useUsage();
  const [pluginEnabled, setPluginEnabled] = useState(false);
  const [iSpeak, setISpeak] = useState(LANGUAGES[0]);
  const [theySpeak, setTheySpeak] = useState(LANGUAGES[1]);
  const [translationMode, setTranslationMode] = useState<TranslationMode>("fast");
  const [audioOutput, setAudioOutput] = useState<AudioOutput>("earbud");
  const [showISpeakPicker, setShowISpeakPicker] = useState(false);
  const [showTheySpeakPicker, setShowTheySpeakPicker] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [hapticOnTranslation, setHapticOnTranslation] = useState(true);
  const [muteOriginalAudio, setMuteOriginalAudio] = useState(true); // DEFAULT ON — only hear translation
  const [hearOriginal, setHearOriginal] = useState(false); // Advanced: hear both (for learners)

  // Usage stats — real data from usage context
  const minutesUsed = usage.talkMinutesUsed;
  const minutesLimit = tierLimits.talkMinutes;
  const percentUsed = minutesLimit === -1 ? 0 : getPercentUsed("talk");

  const swapLanguages = () => {
    const temp = iSpeak;
    setISpeak(theySpeak);
    setTheySpeak(temp);
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Call Translator</Text>
            <Text style={styles.headerSubtitle}>Real-time call translation plugin</Text>
          </View>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </View>

        {/* Live Translate - Speech to Speech */}
        <TouchableOpacity
          style={[styles.mainToggleCard, { borderColor: "#00D4FF", borderWidth: 1 }]}
          onPress={() => router.push("/live-translate")}
        >
          <View style={styles.mainToggleLeft}>
            <View style={[styles.pluginIconWrap, { backgroundColor: "#00D4FF20" }]}>
              <Ionicons name="flash" size={28} color="#00D4FF" />
            </View>
            <View>
              <Text style={styles.mainToggleTitle}>Live Translate</Text>
              <Text style={styles.mainToggleDesc}>
                Speech-to-speech • Faster than Apple
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#00D4FF" />
        </TouchableOpacity>

        {/* Main Toggle */}
        <View style={styles.mainToggleCard}>
          <View style={styles.mainToggleLeft}>
            <View style={styles.pluginIconWrap}>
              <Ionicons name="language" size={28} color="#00D4FF" />
            </View>
            <View>
              <Text style={styles.mainToggleTitle}>Plugin Active</Text>
              <Text style={styles.mainToggleDesc}>
                {pluginEnabled ? "Translating calls in real-time" : "Enable to translate any call"}
              </Text>
            </View>
          </View>
          <Switch
            value={pluginEnabled}
             onValueChange={(val) => {
               setPluginEnabled(val);
               if (val) incrementUsage("talk", 1);
             }}
            trackColor={{ false: "#1a1f2e", true: "#00D4FF" }}
            thumbColor={pluginEnabled ? "#fff" : "#666"}
          />
        </View>

        {/* Status Indicator */}
        {pluginEnabled && (
          <View style={styles.statusBar}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Listening for calls... Ready to translate</Text>
          </View>
        )}

        {/* Language Pair Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language Pair</Text>
          <View style={styles.languagePairCard}>
            {/* I Speak */}
            <TouchableOpacity
              style={styles.langSelector}
              onPress={() => setShowISpeakPicker(!showISpeakPicker)}
            >
              <Text style={styles.langLabel}>I SPEAK</Text>
              <View style={styles.langValue}>
                <Text style={styles.langFlag}>{iSpeak.flag}</Text>
                <Text style={styles.langName}>{iSpeak.name}</Text>
                <Ionicons name="chevron-down" size={16} color="#9BA1A6" />
              </View>
            </TouchableOpacity>

            {/* Swap Button */}
            <TouchableOpacity style={styles.swapBtn} onPress={swapLanguages}>
              <Ionicons name="swap-horizontal" size={22} color="#00D4FF" />
            </TouchableOpacity>

            {/* They Speak */}
            <TouchableOpacity
              style={styles.langSelector}
              onPress={() => setShowTheySpeakPicker(!showTheySpeakPicker)}
            >
              <Text style={styles.langLabel}>THEY SPEAK</Text>
              <View style={styles.langValue}>
                <Text style={styles.langFlag}>{theySpeak.flag}</Text>
                <Text style={styles.langName}>{theySpeak.name}</Text>
                <Ionicons name="chevron-down" size={16} color="#9BA1A6" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Auto-detect toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="ear" size={18} color="#9BA1A6" />
              <Text style={styles.settingLabel}>Auto-detect their language</Text>
            </View>
            <Switch
              value={autoDetect}
              onValueChange={setAutoDetect}
              trackColor={{ false: "#1a1f2e", true: "#00D4FF" }}
              thumbColor={autoDetect ? "#fff" : "#666"}
            />
          </View>

          {/* Language Picker Dropdown */}
          {showISpeakPicker && (
            <View style={styles.pickerDropdown}>
              <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.pickerItem,
                      iSpeak.code === lang.code && styles.pickerItemActive,
                    ]}
                    onPress={() => {
                      setISpeak(lang);
                      setShowISpeakPicker(false);
                    }}
                  >
                    <Text style={styles.pickerFlag}>{lang.flag}</Text>
                    <Text style={styles.pickerName}>{lang.name}</Text>
                    {iSpeak.code === lang.code && (
                      <Ionicons name="checkmark" size={18} color="#00D4FF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {showTheySpeakPicker && (
            <View style={styles.pickerDropdown}>
              <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.pickerItem,
                      theySpeak.code === lang.code && styles.pickerItemActive,
                    ]}
                    onPress={() => {
                      setTheySpeak(lang);
                      setShowTheySpeakPicker(false);
                    }}
                  >
                    <Text style={styles.pickerFlag}>{lang.flag}</Text>
                    <Text style={styles.pickerName}>{lang.name}</Text>
                    {theySpeak.code === lang.code && (
                      <Ionicons name="checkmark" size={18} color="#00D4FF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Translation Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Translation Mode</Text>
          <View style={styles.modeCards}>
            <TouchableOpacity
              style={[
                styles.modeCard,
                translationMode === "fast" && styles.modeCardActive,
              ]}
              onPress={() => setTranslationMode("fast")}
            >
              <Ionicons
                name="flash"
                size={24}
                color={translationMode === "fast" ? "#00D4FF" : "#666"}
              />
              <Text
                style={[
                  styles.modeTitle,
                  translationMode === "fast" && styles.modeTitleActive,
                ]}
              >
                Fast Mode
              </Text>
              <Text style={styles.modeDesc}>~500ms latency</Text>
              <Text style={styles.modeDetail}>Speech-to-Speech</Text>
              <Text style={styles.modeDetail}>Natural sounding</Text>
              <Text style={styles.modeDetail}>No subtitles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                translationMode === "study" && styles.modeCardActive,
              ]}
              onPress={() => setTranslationMode("study")}
            >
              <Ionicons
                name="book"
                size={24}
                color={translationMode === "study" ? "#FFD700" : "#666"}
              />
              <Text
                style={[
                  styles.modeTitle,
                  translationMode === "study" && styles.modeTitleActive,
                ]}
              >
                Study Mode
              </Text>
              <Text style={styles.modeDesc}>~2-3s latency</Text>
              <Text style={styles.modeDetail}>Shows subtitles</Text>
              <Text style={styles.modeDetail}>Vocabulary highlights</Text>
              <Text style={styles.modeDetail}>Learn while talking</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Audio Output */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Output</Text>
          <View style={styles.audioOptions}>
            {[
              { key: "earbud" as AudioOutput, icon: "headset", label: "One Earbud", desc: "Translation in one ear, call in other" },
              { key: "speaker" as AudioOutput, icon: "volume-high", label: "Speaker", desc: "Translation plays over speaker" },
              { key: "text" as AudioOutput, icon: "text", label: "Text Only", desc: "Silent — captions overlay only" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.audioOption,
                  audioOutput === opt.key && styles.audioOptionActive,
                ]}
                onPress={() => setAudioOutput(opt.key)}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={20}
                  color={audioOutput === opt.key ? "#00D4FF" : "#666"}
                />
                <View style={styles.audioOptionText}>
                  <Text
                    style={[
                      styles.audioOptionLabel,
                      audioOutput === opt.key && styles.audioOptionLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.audioOptionDesc}>{opt.desc}</Text>
                </View>
                {audioOutput === opt.key && (
                  <Ionicons name="checkmark-circle" size={20} color="#00D4FF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Audio Behavior During Translation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Behavior</Text>
          <View style={styles.audioBehaviorCard}>
            <View style={styles.audioBehaviorHeader}>
              <Ionicons name="volume-mute" size={20} color="#00D4FF" />
              <Text style={styles.audioBehaviorTitle}>Mute Original Audio</Text>
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
              </View>
            </View>
            <Text style={styles.audioBehaviorDesc}>
              When translation is active, the original speaker's audio is silenced so you only hear the translated version. No confusion — just clear understanding.
            </Text>
            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="volume-off" size={18} color="#22C55E" />
                <View>
                  <Text style={styles.settingLabel}>Only hear translation</Text>
                  <Text style={styles.settingSubLabel}>Original audio silenced (recommended)</Text>
                </View>
              </View>
              <Switch
                value={muteOriginalAudio}
                onValueChange={(val) => {
                  setMuteOriginalAudio(val);
                  if (val) setHearOriginal(false);
                }}
                trackColor={{ false: "#1a1f2e", true: "#22C55E" }}
                thumbColor={muteOriginalAudio ? "#fff" : "#666"}
              />
            </View>
            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="ear" size={18} color={hearOriginal ? "#FFD700" : "#9BA1A6"} />
                <View>
                  <Text style={styles.settingLabel}>Hear both (advanced learners)</Text>
                  <Text style={styles.settingSubLabel}>Original at 20% volume + translation at full</Text>
                </View>
              </View>
              <Switch
                value={hearOriginal}
                onValueChange={(val) => {
                  setHearOriginal(val);
                  if (val) setMuteOriginalAudio(false);
                }}
                trackColor={{ false: "#1a1f2e", true: "#FFD700" }}
                thumbColor={hearOriginal ? "#fff" : "#666"}
              />
            </View>
          </View>
          <Text style={styles.audioBehaviorNote}>
            This applies to all translations: calls, social media, videos, and URL content.
          </Text>
        </View>

        {/* Additional Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="document-text" size={18} color="#9BA1A6" />
                <Text style={styles.settingLabel}>Show live transcript</Text>
              </View>
              <Switch
                value={showTranscript}
                onValueChange={setShowTranscript}
                trackColor={{ false: "#1a1f2e", true: "#00D4FF" }}
                thumbColor={showTranscript ? "#fff" : "#666"}
              />
            </View>
            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="phone-portrait" size={18} color="#9BA1A6" />
                <Text style={styles.settingLabel}>Haptic on new translation</Text>
              </View>
              <Switch
                value={hapticOnTranslation}
                onValueChange={setHapticOnTranslation}
                trackColor={{ false: "#1a1f2e", true: "#00D4FF" }}
                thumbColor={hapticOnTranslation ? "#fff" : "#666"}
              />
            </View>
          </View>
        </View>

        {/* Usage Meter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage This Month</Text>
          <View style={styles.usageCard}>
            <View style={styles.usageHeader}>
              <Text style={styles.usageMinutes}>{minutesUsed} min</Text>
              <Text style={styles.usageLimit}>/ {minutesLimit} min</Text>
            </View>
            <View style={styles.usageBarBg}>
              <View style={[styles.usageBarFill, { width: `${percentUsed}%` }]} />
            </View>
            <Text style={styles.usageNote}>
              {minutesLimit - minutesUsed} minutes remaining • Resets in 18 days
            </Text>
            <TouchableOpacity style={styles.upgradeBtn}>
              <Ionicons name="infinite" size={16} color="#060912" />
              <Text style={styles.upgradeBtnText}>Upgrade for Unlimited</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compatible Apps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Works With</Text>
          <View style={styles.compatGrid}>
            {COMPATIBLE_APPS.map((app) => (
              <View key={app.name} style={styles.compatItem}>
                <View style={styles.compatIcon}>
                  <Ionicons name={app.icon as any} size={20} color="#00D4FF" />
                </View>
                <Text style={styles.compatName}>{app.name}</Text>
                <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
              </View>
            ))}
          </View>
        </View>

        {/* Test Translation Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.testBtn}>
            <Ionicons name="mic" size={22} color="#060912" />
            <Text style={styles.testBtnText}>Test Translation</Text>
          </TouchableOpacity>
          <Text style={styles.testNote}>
            Speak a sentence and hear it translated instantly
          </Text>
        </View>

        {/* Desktop & Browser Extensions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Platforms</Text>
          <View style={styles.platformCards}>
            <TouchableOpacity style={styles.platformCard}>
              <Ionicons name="desktop" size={24} color="#9BA1A6" />
              <Text style={styles.platformTitle}>Desktop App</Text>
              <Text style={styles.platformDesc}>Mac & Windows</Text>
              <View style={styles.platformBadge}>
                <Text style={styles.platformBadgeText}>Coming Soon</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.platformCard}>
              <Ionicons name="globe" size={24} color="#9BA1A6" />
              <Text style={styles.platformTitle}>Browser Extension</Text>
              <Text style={styles.platformDesc}>Chrome & Firefox</Text>
              <View style={styles.platformBadge}>
                <Text style={styles.platformBadgeText}>Coming Soon</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsCard}>
            {[
              { step: "1", title: "Enable Plugin", desc: "Toggle on above to activate the translation service" },
              { step: "2", title: "Make or Receive a Call", desc: "Use any app — Phone, FaceTime, WhatsApp, Instagram, etc." },
              { step: "3", title: "Tap Translate", desc: "Tap the ConnectWorld AI notification banner during the call" },
              { step: "4", title: "Speak Naturally", desc: "Talk in your language — they hear theirs, you hear yours" },
            ].map((item) => (
              <View key={item.step} style={styles.stepRow}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNum}>{item.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{item.title}</Text>
                  <Text style={styles.stepDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Permissions Notice */}
        <View style={styles.section}>
          <View style={styles.permissionsCard}>
            <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
            <View style={styles.permissionsText}>
              <Text style={styles.permissionsTitle}>Privacy & Permissions</Text>
              <Text style={styles.permissionsDesc}>
                Audio is processed in real-time and never stored. Requires microphone access
                and notification permissions.{" "}
                {Platform.OS === "android" ? "Accessibility service needed for overlay." : ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060912",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0d1220",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#9BA1A6",
    fontSize: 12,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proBadgeText: {
    color: "#060912",
    fontSize: 10,
    fontWeight: "800",
  },
  mainToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0d1220",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1a2744",
  },
  mainToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pluginIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,212,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainToggleTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  mainToggleDesc: {
    color: "#9BA1A6",
    fontSize: 12,
    marginTop: 2,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,212,255,0.08)",
    borderRadius: 8,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  statusText: {
    color: "#00D4FF",
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: "#9BA1A6",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  languagePairCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d1220",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1a2744",
  },
  langSelector: {
    flex: 1,
    alignItems: "center",
  },
  langLabel: {
    color: "#9BA1A6",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  langValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  langFlag: {
    fontSize: 20,
  },
  langName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,212,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  pickerDropdown: {
    backgroundColor: "#0d1220",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#1a2744",
    maxHeight: 200,
  },
  pickerScroll: {
    padding: 8,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    gap: 10,
  },
  pickerItemActive: {
    backgroundColor: "rgba(0,212,255,0.1)",
  },
  pickerFlag: {
    fontSize: 18,
  },
  pickerName: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  modeCards: {
    flexDirection: "row",
    gap: 12,
  },
  modeCard: {
    flex: 1,
    backgroundColor: "#0d1220",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a2744",
    gap: 6,
  },
  modeCardActive: {
    borderColor: "#00D4FF",
    backgroundColor: "rgba(0,212,255,0.05)",
  },
  modeTitle: {
    color: "#9BA1A6",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  modeTitleActive: {
    color: "#fff",
  },
  modeDesc: {
    color: "#00D4FF",
    fontSize: 11,
    fontWeight: "500",
  },
  modeDetail: {
    color: "#687076",
    fontSize: 11,
  },
  audioOptions: {
    gap: 8,
  },
  audioOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d1220",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1a2744",
    gap: 12,
  },
  audioOptionActive: {
    borderColor: "#00D4FF",
    backgroundColor: "rgba(0,212,255,0.05)",
  },
  audioOptionText: {
    flex: 1,
  },
  audioOptionLabel: {
    color: "#9BA1A6",
    fontSize: 14,
    fontWeight: "500",
  },
  audioOptionLabelActive: {
    color: "#fff",
  },
  audioOptionDesc: {
    color: "#687076",
    fontSize: 11,
    marginTop: 2,
  },
  settingsCard: {
    backgroundColor: "#0d1220",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#1a2744",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingLabel: {
    color: "#ECEDEE",
    fontSize: 14,
  },
  settingDivider: {
    height: 1,
    backgroundColor: "#1a2744",
    marginHorizontal: 12,
  },
  usageCard: {
    backgroundColor: "#0d1220",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1a2744",
  },
  usageHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 10,
  },
  usageMinutes: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  usageLimit: {
    color: "#9BA1A6",
    fontSize: 14,
    marginLeft: 4,
  },
  usageBarBg: {
    height: 8,
    backgroundColor: "#1a2744",
    borderRadius: 4,
    overflow: "hidden",
  },
  usageBarFill: {
    height: "100%",
    backgroundColor: "#00D4FF",
    borderRadius: 4,
  },
  usageNote: {
    color: "#687076",
    fontSize: 12,
    marginTop: 8,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 14,
    gap: 6,
  },
  upgradeBtnText: {
    color: "#060912",
    fontSize: 14,
    fontWeight: "700",
  },
  compatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  compatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d1220",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#1a2744",
  },
  compatIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,212,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  compatName: {
    color: "#ECEDEE",
    fontSize: 12,
    fontWeight: "500",
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00D4FF",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  testBtnText: {
    color: "#060912",
    fontSize: 16,
    fontWeight: "700",
  },
  testNote: {
    color: "#687076",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  platformCards: {
    flexDirection: "row",
    gap: 12,
  },
  platformCard: {
    flex: 1,
    backgroundColor: "#0d1220",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a2744",
    gap: 6,
  },
  platformTitle: {
    color: "#ECEDEE",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  platformDesc: {
    color: "#687076",
    fontSize: 11,
  },
  platformBadge: {
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  platformBadgeText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "600",
  },
  stepsCard: {
    backgroundColor: "#0d1220",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1a2744",
    gap: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,212,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    color: "#00D4FF",
    fontSize: 13,
    fontWeight: "700",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  stepDesc: {
    color: "#687076",
    fontSize: 12,
    marginTop: 2,
  },
  permissionsCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(34,197,94,0.08)",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },
  permissionsText: {
    flex: 1,
  },
  permissionsTitle: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "600",
  },
  permissionsDesc: {
    color: "#9BA1A6",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  audioBehaviorCard: {
    backgroundColor: "#0d1220",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  audioBehaviorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  audioBehaviorTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: {
    color: "#22C55E",
    fontSize: 10,
    fontWeight: "700",
  },
  audioBehaviorDesc: {
    color: "#9BA1A6",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  audioBehaviorNote: {
    color: "#687076",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  settingSubLabel: {
    color: "#687076",
    fontSize: 11,
    marginTop: 2,
  },
});
