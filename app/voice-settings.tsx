import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

// Voice accent options mapped to target languages
const ACCENT_OPTIONS: Record<string, { id: string; label: string; description: string; flag: string }[]> = {
  es: [
    { id: "es-mx", label: "Mexican Spanish", description: "Warm, melodic tone common in Mexico", flag: "🇲🇽" },
    { id: "es-co", label: "Colombian Spanish", description: "Clear, neutral accent from Bogotá", flag: "🇨🇴" },
    { id: "es-ar", label: "Argentine Spanish", description: "Distinctive rioplatense with Italian influence", flag: "🇦🇷" },
    { id: "es-es", label: "Castilian Spanish", description: "European Spanish from Madrid", flag: "🇪🇸" },
    { id: "es-do", label: "Dominican Spanish", description: "Fast-paced Caribbean style", flag: "🇩🇴" },
    { id: "es-pr", label: "Puerto Rican Spanish", description: "Caribbean with unique slang", flag: "🇵🇷" },
    { id: "es-cu", label: "Cuban Spanish", description: "Rhythmic Caribbean dialect", flag: "🇨🇺" },
  ],
  fr: [
    { id: "fr-fr", label: "Parisian French", description: "Standard metropolitan French", flag: "🇫🇷" },
    { id: "fr-ca", label: "Québécois French", description: "Canadian French with unique expressions", flag: "🇨🇦" },
    { id: "fr-ht", label: "Haitian Creole French", description: "Creole-influenced French", flag: "🇭🇹" },
    { id: "fr-sn", label: "Senegalese French", description: "West African French dialect", flag: "🇸🇳" },
  ],
  pt: [
    { id: "pt-br", label: "Brazilian Portuguese", description: "Warm, open pronunciation", flag: "🇧🇷" },
    { id: "pt-pt", label: "European Portuguese", description: "Lisbon standard accent", flag: "🇵🇹" },
  ],
  en: [
    { id: "en-us", label: "American English", description: "General American accent", flag: "🇺🇸" },
    { id: "en-gb", label: "British English", description: "Received Pronunciation (RP)", flag: "🇬🇧" },
    { id: "en-au", label: "Australian English", description: "Aussie accent and slang", flag: "🇦🇺" },
    { id: "en-ng", label: "Nigerian English", description: "West African English variety", flag: "🇳🇬" },
    { id: "en-jm", label: "Jamaican English", description: "Caribbean patois influence", flag: "🇯🇲" },
    { id: "en-in", label: "Indian English", description: "South Asian English variety", flag: "🇮🇳" },
  ],
  ja: [
    { id: "ja-standard", label: "Standard Japanese", description: "Tokyo dialect (hyōjungo)", flag: "🇯🇵" },
    { id: "ja-kansai", label: "Kansai Dialect", description: "Osaka/Kyoto regional speech", flag: "🇯🇵" },
  ],
  ko: [
    { id: "ko-standard", label: "Standard Korean", description: "Seoul standard dialect", flag: "🇰🇷" },
    { id: "ko-busan", label: "Busan Dialect", description: "Gyeongsang regional accent", flag: "🇰🇷" },
  ],
  zh: [
    { id: "zh-mandarin", label: "Mandarin", description: "Standard Beijing Mandarin", flag: "🇨🇳" },
    { id: "zh-cantonese", label: "Cantonese", description: "Hong Kong/Guangdong dialect", flag: "🇭🇰" },
    { id: "zh-tw", label: "Taiwanese Mandarin", description: "Taiwan standard with local flavor", flag: "🇹🇼" },
  ],
  de: [
    { id: "de-de", label: "Standard German", description: "Hochdeutsch from Berlin", flag: "🇩🇪" },
    { id: "de-at", label: "Austrian German", description: "Viennese dialect influence", flag: "🇦🇹" },
    { id: "de-ch", label: "Swiss German", description: "Swiss dialect characteristics", flag: "🇨🇭" },
  ],
  it: [
    { id: "it-standard", label: "Standard Italian", description: "Florentine-based standard", flag: "🇮🇹" },
    { id: "it-south", label: "Southern Italian", description: "Neapolitan/Sicilian influence", flag: "🇮🇹" },
  ],
  ar: [
    { id: "ar-msa", label: "Modern Standard Arabic", description: "Formal/media Arabic", flag: "🇸🇦" },
    { id: "ar-eg", label: "Egyptian Arabic", description: "Cairo dialect (most widely understood)", flag: "🇪🇬" },
    { id: "ar-lev", label: "Levantine Arabic", description: "Syrian/Lebanese/Jordanian", flag: "🇱🇧" },
    { id: "ar-gulf", label: "Gulf Arabic", description: "UAE/Qatar/Kuwait dialect", flag: "🇦🇪" },
  ],
};

const DEFAULT_ACCENTS = [
  { id: "standard", label: "Standard", description: "Standard pronunciation", flag: "🌐" },
];

const SPEED_OPTIONS = [
  { id: "slow", label: "Slow", description: "Beginner-friendly pace", icon: "walk" },
  { id: "normal", label: "Normal", description: "Natural conversation speed", icon: "bicycle" },
  { id: "fast", label: "Fast", description: "Native speaker pace", icon: "rocket" },
];

const VOICE_STYLE_OPTIONS = [
  { id: "female-warm", label: "Female (Warm)", description: "Friendly, encouraging tone" },
  { id: "female-professional", label: "Female (Professional)", description: "Clear, authoritative tone" },
  { id: "male-warm", label: "Male (Warm)", description: "Calm, patient tone" },
  { id: "male-energetic", label: "Male (Energetic)", description: "Upbeat, motivating tone" },
];

// ─── NEW: Coaching Style Options ─────────────────────────────────────────────
const COACHING_STYLE_OPTIONS = [
  {
    id: "gentle",
    label: "Gentle Encourager",
    description: "Soft, patient, always positive. Like a supportive best friend who never judges.",
    icon: "heart" as const,
    color: "#FF6B9D",
    example: "\"You're doing great, take your time. Every step forward counts.\"",
  },
  {
    id: "balanced",
    label: "Balanced Coach",
    description: "Warm but honest. Celebrates wins and gently pushes through challenges.",
    icon: "fitness" as const,
    color: Colors.secondary,
    example: "\"Good work today! I noticed you struggled with conjugations — let's drill those tomorrow.\"",
  },
  {
    id: "tough_love",
    label: "Tough Love",
    description: "Direct, no-nonsense. Pushes you hard because they believe in your potential.",
    icon: "flame" as const,
    color: "#FF6B35",
    example: "\"You can do better than that. I've seen what you're capable of — let's go again.\"",
  },
  {
    id: "motivational",
    label: "Motivational Speaker",
    description: "High-energy, inspiring. Every session feels like a pep rally for your brain.",
    icon: "megaphone" as const,
    color: "#FFD700",
    example: "\"You are UNSTOPPABLE! Every word you learn is a weapon in your arsenal!\"",
  },
  {
    id: "therapist",
    label: "Mindful Therapist",
    description: "Calm, reflective, emotionally aware. Checks in on how you're feeling, not just what you're learning.",
    icon: "leaf" as const,
    color: "#4ADE80",
    example: "\"Before we start, how are you really feeling today? Your wellbeing matters more than any lesson.\"",
  },
];

// ─── NEW: Wave Cloud Personality Mode ────────────────────────────────────────
const PERSONALITY_MODE_OPTIONS = [
  {
    id: "auto",
    label: "Adaptive (Recommended)",
    description: "Wave Cloud reads your mood and switches between therapist, coach, motivator, and friend automatically.",
    icon: "sparkles" as const,
  },
  {
    id: "therapist",
    label: "Always Therapist",
    description: "Prioritizes emotional wellbeing. Checks in on feelings before tasks.",
    icon: "heart-circle" as const,
  },
  {
    id: "coach",
    label: "Always Coach",
    description: "Focused on goals and accountability. Tracks your progress relentlessly.",
    icon: "trophy" as const,
  },
  {
    id: "motivator",
    label: "Always Motivator",
    description: "Pure energy and encouragement. Every interaction is a pep talk.",
    icon: "flash" as const,
  },
  {
    id: "friend",
    label: "Always Friend",
    description: "Casual, relaxed, just vibes. Like texting your best friend who happens to know everything.",
    icon: "people" as const,
  },
  {
    id: "life_advisor",
    label: "Always Life Advisor",
    description: "Dale Carnegie meets your wisest mentor. Advice on school, friendships, influence, and life.",
    icon: "school" as const,
  },
];

// ─── NEW: Check-in Frequency Options ────────────────────────────────────────
const CHECKIN_FREQUENCY_OPTIONS = [
  { id: "often", label: "Often", description: "Morning + afternoon + evening", icon: "notifications" as const },
  { id: "daily", label: "Daily", description: "Once a day (morning or evening)", icon: "sunny" as const },
  { id: "weekly", label: "Weekly", description: "A few times a week", icon: "calendar" as const },
  { id: "minimal", label: "Minimal", description: "Only when something important comes up", icon: "moon" as const },
];

export interface VoiceSettings {
  accent: string;
  speed: string;
  voiceStyle: string;
  matchLearningLanguage: boolean;
  speakInTargetLanguage: boolean;
  emotionAdaptive: boolean;
  // NEW: Coaching & personality
  coachingStyle: string;
  personalityMode: string;
  checkInFrequency: string;
  teacherTextsEnabled: boolean;
  surpriseLessonsEnabled: boolean;
  wellbeingCheckInsEnabled: boolean;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  accent: "",
  speed: "normal",
  voiceStyle: "female-warm",
  matchLearningLanguage: true,
  speakInTargetLanguage: true,
  emotionAdaptive: true,
  coachingStyle: "balanced",
  personalityMode: "auto",
  checkInFrequency: "daily",
  teacherTextsEnabled: true,
  surpriseLessonsEnabled: true,
  wellbeingCheckInsEnabled: true,
};

export default function VoiceSettingsScreen() {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<"voice" | "coaching" | "notifications">("voice");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem("@voice_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
      const target = await AsyncStorage.getItem("@target_language");
      if (target) setTargetLanguage(target);
    } catch {}
  };

  const updateSetting = useCallback(<K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    await AsyncStorage.setItem("@voice_settings", JSON.stringify(settings));
    setHasChanges(false);
    router.back();
  };

  const accentOptions = ACCENT_OPTIONS[targetLanguage] || DEFAULT_ACCENTS;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wave Cloud Settings</Text>
          {hasChanges && (
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          {([
            { id: "voice" as const, label: "Voice", icon: "mic" as const },
            { id: "coaching" as const, label: "Coaching", icon: "heart" as const },
            { id: "notifications" as const, label: "Check-ins", icon: "notifications" as const },
          ]).map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeSection === tab.id && styles.tabActive]}
              onPress={() => setActiveSection(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={18}
                color={activeSection === tab.id ? Colors.secondary : Colors.textSecondary}
              />
              <Text style={[styles.tabLabel, activeSection === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ═══ VOICE TAB ═══ */}
        {activeSection === "voice" && (
          <>
            <View style={styles.descriptionCard}>
              <Ionicons name="sparkles" size={20} color={Colors.gold} />
              <Text style={styles.descriptionText}>
                Customize how Wave Cloud and your AI teachers speak. Choose an accent that matches the dialect you're learning.
              </Text>
            </View>

            {/* Accent Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Accent & Dialect</Text>
              <Text style={styles.sectionSubtitle}>
                Your teacher will speak with this accent style
              </Text>
              {accentOptions.map((accent) => {
                const isSelected = settings.accent === accent.id;
                return (
                  <TouchableOpacity
                    key={accent.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => updateSetting("accent", accent.id)}
                  >
                    <Text style={styles.accentFlag}>{accent.flag}</Text>
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {accent.label}
                      </Text>
                      <Text style={styles.optionDesc}>{accent.description}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Voice Speed */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Speaking Speed</Text>
              <View style={styles.speedRow}>
                {SPEED_OPTIONS.map((speed) => {
                  const isSelected = settings.speed === speed.id;
                  return (
                    <TouchableOpacity
                      key={speed.id}
                      style={[styles.speedChip, isSelected && styles.speedChipSelected]}
                      onPress={() => updateSetting("speed", speed.id)}
                    >
                      <Ionicons
                        name={speed.icon as any}
                        size={20}
                        color={isSelected ? Colors.primary : Colors.textSecondary}
                      />
                      <Text style={[styles.speedLabel, isSelected && styles.speedLabelSelected]}>
                        {speed.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Voice Style */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Voice Style</Text>
              {VOICE_STYLE_OPTIONS.map((style) => {
                const isSelected = settings.voiceStyle === style.id;
                return (
                  <TouchableOpacity
                    key={style.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => updateSetting("voiceStyle", style.id)}
                  >
                    <Ionicons
                      name="person-circle"
                      size={28}
                      color={isSelected ? Colors.secondary : Colors.textSecondary}
                    />
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {style.label}
                      </Text>
                      <Text style={styles.optionDesc}>{style.description}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Behavior Toggles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Behavior</Text>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Match Learning Language</Text>
                  <Text style={styles.toggleDesc}>
                    Teacher speaks English with the accent of your target language
                  </Text>
                </View>
                <Switch
                  value={settings.matchLearningLanguage}
                  onValueChange={(v) => updateSetting("matchLearningLanguage", v)}
                  trackColor={{ false: Colors.border, true: Colors.secondary + "80" }}
                  thumbColor={settings.matchLearningLanguage ? Colors.secondary : Colors.textSecondary}
                />
              </View>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Speak in Target Language</Text>
                  <Text style={styles.toggleDesc}>
                    Teacher primarily speaks in the language you're learning
                  </Text>
                </View>
                <Switch
                  value={settings.speakInTargetLanguage}
                  onValueChange={(v) => updateSetting("speakInTargetLanguage", v)}
                  trackColor={{ false: Colors.border, true: Colors.secondary + "80" }}
                  thumbColor={settings.speakInTargetLanguage ? Colors.secondary : Colors.textSecondary}
                />
              </View>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Emotion-Adaptive</Text>
                  <Text style={styles.toggleDesc}>
                    AI adjusts pace and encouragement based on your confidence (powered by Hume)
                  </Text>
                </View>
                <Switch
                  value={settings.emotionAdaptive}
                  onValueChange={(v) => updateSetting("emotionAdaptive", v)}
                  trackColor={{ false: Colors.border, true: Colors.secondary + "80" }}
                  thumbColor={settings.emotionAdaptive ? Colors.secondary : Colors.textSecondary}
                />
              </View>
            </View>
          </>
        )}

        {/* ═══ COACHING TAB ═══ */}
        {activeSection === "coaching" && (
          <>
            <View style={styles.descriptionCard}>
              <Ionicons name="heart" size={20} color="#FF6B9D" />
              <Text style={styles.descriptionText}>
                Choose how Wave Cloud coaches you. This affects how it talks to you, pushes you, and supports you across everything — not just language learning.
              </Text>
            </View>

            {/* Coaching Style */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Coaching Style</Text>
              <Text style={styles.sectionSubtitle}>
                How should Wave Cloud push and support you?
              </Text>
              {COACHING_STYLE_OPTIONS.map((style) => {
                const isSelected = settings.coachingStyle === style.id;
                return (
                  <TouchableOpacity
                    key={style.id}
                    style={[styles.coachingCard, isSelected && { borderColor: style.color, backgroundColor: style.color + "08" }]}
                    onPress={() => updateSetting("coachingStyle", style.id)}
                  >
                    <View style={styles.coachingCardHeader}>
                      <View style={[styles.coachingIconWrap, { backgroundColor: style.color + "20" }]}>
                        <Ionicons name={style.icon} size={22} color={style.color} />
                      </View>
                      <View style={styles.optionInfo}>
                        <Text style={[styles.optionLabel, isSelected && { color: style.color }]}>
                          {style.label}
                        </Text>
                        <Text style={styles.optionDesc}>{style.description}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color={style.color} />
                      )}
                    </View>
                    <View style={styles.exampleBubble}>
                      <Text style={styles.exampleText}>{style.example}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Personality Mode */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wave Cloud Personality</Text>
              <Text style={styles.sectionSubtitle}>
                Wave Cloud is your therapist, coach, motivator, and friend. Choose a default mode or let it adapt.
              </Text>
              {PERSONALITY_MODE_OPTIONS.map((mode) => {
                const isSelected = settings.personalityMode === mode.id;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => updateSetting("personalityMode", mode.id)}
                  >
                    <Ionicons
                      name={mode.icon}
                      size={24}
                      color={isSelected ? Colors.secondary : Colors.textSecondary}
                    />
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {mode.label}
                      </Text>
                      <Text style={styles.optionDesc}>{mode.description}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ═══ NOTIFICATIONS TAB ═══ */}
        {activeSection === "notifications" && (
          <>
            <View style={styles.descriptionCard}>
              <Ionicons name="notifications" size={20} color={Colors.secondary} />
              <Text style={styles.descriptionText}>
                Control how often Wave Cloud reaches out to you. It can check in on your wellbeing, remind you of tasks, and send your teacher's messages.
              </Text>
            </View>

            {/* Check-in Frequency */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Check-in Frequency</Text>
              <Text style={styles.sectionSubtitle}>
                How often should Wave Cloud reach out?
              </Text>
              {CHECKIN_FREQUENCY_OPTIONS.map((freq) => {
                const isSelected = settings.checkInFrequency === freq.id;
                return (
                  <TouchableOpacity
                    key={freq.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => updateSetting("checkInFrequency", freq.id)}
                  >
                    <Ionicons
                      name={freq.icon}
                      size={24}
                      color={isSelected ? Colors.secondary : Colors.textSecondary}
                    />
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {freq.label}
                      </Text>
                      <Text style={styles.optionDesc}>{freq.description}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feature Toggles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Features</Text>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Teacher Texts You</Text>
                  <Text style={styles.toggleDesc}>
                    Your AI teacher sends casual check-in messages in your target language throughout the day
                  </Text>
                </View>
                <Switch
                  value={settings.teacherTextsEnabled}
                  onValueChange={(v) => updateSetting("teacherTextsEnabled", v)}
                  trackColor={{ false: Colors.border, true: Colors.secondary + "80" }}
                  thumbColor={settings.teacherTextsEnabled ? Colors.secondary : Colors.textSecondary}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Surprise Lessons</Text>
                  <Text style={styles.toggleDesc}>
                    When you haven't opened the app in a while, get a fun micro-lesson based on trending culture
                  </Text>
                </View>
                <Switch
                  value={settings.surpriseLessonsEnabled}
                  onValueChange={(v) => updateSetting("surpriseLessonsEnabled", v)}
                  trackColor={{ false: Colors.border, true: Colors.secondary + "80" }}
                  thumbColor={settings.surpriseLessonsEnabled ? Colors.secondary : Colors.textSecondary}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Wellbeing Check-ins</Text>
                  <Text style={styles.toggleDesc}>
                    Wave Cloud periodically asks how you're feeling and offers support
                  </Text>
                </View>
                <Switch
                  value={settings.wellbeingCheckInsEnabled}
                  onValueChange={(v) => updateSetting("wellbeingCheckInsEnabled", v)}
                  trackColor={{ false: Colors.border, true: Colors.secondary + "80" }}
                  thumbColor={settings.wellbeingCheckInsEnabled ? Colors.secondary : Colors.textSecondary}
                />
              </View>
            </View>
          </>
        )}

        {/* Save Button */}
        {hasChanges && (
          <TouchableOpacity style={styles.saveFullButton} onPress={handleSave}>
            <Text style={styles.saveFullButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginLeft: 12,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
  },
  saveButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  // Tab switcher
  tabRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.secondary,
  },
  descriptionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.gold + "12",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  descriptionText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: BorderRadius.lg,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionCardSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + "08",
  },
  accentFlag: { fontSize: 28 },
  optionInfo: { flex: 1 },
  optionLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  optionLabelSelected: {
    color: Colors.secondary,
  },
  optionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  speedRow: {
    flexDirection: "row",
    gap: 10,
  },
  speedChip: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  speedChipSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + "12",
  },
  speedLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  speedLabelSelected: {
    color: Colors.secondary,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  toggleDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  // Coaching card styles
  coachingCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: BorderRadius.lg,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  coachingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coachingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  exampleBubble: {
    marginTop: 10,
    backgroundColor: Colors.primary + "40",
    borderRadius: BorderRadius.md,
    padding: 10,
  },
  exampleText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: "italic",
    lineHeight: 16,
  },
  saveFullButton: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  saveFullButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
  },
});
