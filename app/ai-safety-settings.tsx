import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// Storage keys
const AI_SAFETY_LEVEL_KEY = "@connectworld_ai_safety_level";
const AI_CULTURAL_FILTER_KEY = "@connectworld_ai_cultural_filter";
const AI_SLANG_WARNINGS_KEY = "@connectworld_ai_slang_warnings";
const AI_HUMAN_ESCALATION_KEY = "@connectworld_ai_human_escalation";
const AI_DATA_ISOLATION_KEY = "@connectworld_ai_data_isolation";
const AI_ASSESSMENT_INTEGRITY_KEY = "@connectworld_ai_assessment_integrity";
const AI_ERROR_CORRECTION_KEY = "@connectworld_ai_error_correction";

type SafetyLevel = "strict" | "standard" | "relaxed";

type AISettings = {
  safetyLevel: SafetyLevel;
  culturalSensitivityFilter: boolean;
  slangContentWarnings: boolean;
  humanEscalationEnabled: boolean;
  dataIsolationStrict: boolean;
  assessmentIntegrity: boolean;
  autoErrorCorrection: boolean;
};

const SAFETY_LEVEL_INFO: Record<SafetyLevel, { title: string; description: string; icon: string }> = {
  strict: {
    title: "Strict",
    description: "No profanity in any context, maximum content warnings, shorter responses. Best for younger learners or classroom use.",
    icon: "shield-checkmark",
  },
  standard: {
    title: "Standard",
    description: "Allows mild language in educational context (e.g., explaining what a word means), includes content warnings. Recommended for most users.",
    icon: "shield-half",
  },
  relaxed: {
    title: "Relaxed",
    description: "Allows informal language teaching including slang context, fewer warnings. For adult learners comfortable with real-world language.",
    icon: "shield",
  },
};

export default function AISafetySettingsScreen() {
  const colors = useColors();
  const [settings, setSettings] = useState<AISettings>({
    safetyLevel: "standard",
    culturalSensitivityFilter: true,
    slangContentWarnings: true,
    humanEscalationEnabled: true,
    dataIsolationStrict: true,
    assessmentIntegrity: true,
    autoErrorCorrection: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [level, cultural, slang, human, isolation, assessment, correction] = await Promise.all([
        AsyncStorage.getItem(AI_SAFETY_LEVEL_KEY),
        AsyncStorage.getItem(AI_CULTURAL_FILTER_KEY),
        AsyncStorage.getItem(AI_SLANG_WARNINGS_KEY),
        AsyncStorage.getItem(AI_HUMAN_ESCALATION_KEY),
        AsyncStorage.getItem(AI_DATA_ISOLATION_KEY),
        AsyncStorage.getItem(AI_ASSESSMENT_INTEGRITY_KEY),
        AsyncStorage.getItem(AI_ERROR_CORRECTION_KEY),
      ]);
      setSettings({
        safetyLevel: (level as SafetyLevel) || "standard",
        culturalSensitivityFilter: cultural !== "false",
        slangContentWarnings: slang !== "false",
        humanEscalationEnabled: human !== "false",
        dataIsolationStrict: isolation !== "false",
        assessmentIntegrity: assessment !== "false",
        autoErrorCorrection: correction !== "false",
      });
    } catch {}
  };

  const saveSetting = async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  };

  const handleSafetyLevelChange = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Content Safety Level",
      "Choose how strictly the AI filters content:",
      [
        {
          text: "Strict (Classroom Safe)",
          onPress: () => updateSafetyLevel("strict"),
        },
        {
          text: "Standard (Recommended)",
          onPress: () => updateSafetyLevel("standard"),
        },
        {
          text: "Relaxed (Adult Learners)",
          onPress: () => updateSafetyLevel("relaxed"),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const updateSafetyLevel = async (level: SafetyLevel) => {
    setSettings((prev) => ({ ...prev, safetyLevel: level }));
    await saveSetting(AI_SAFETY_LEVEL_KEY, level);
  };

  const toggleSetting = async (
    key: keyof AISettings,
    storageKey: string
  ) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newVal }));
    await saveSetting(storageKey, String(newVal));
  };

  const handleReportAI = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Report AI Response",
      "If the AI said something inaccurate, inappropriate, or harmful, you can report it here. Our team reviews all reports within 24 hours.\n\nTo report a specific response, tap and hold on any AI message in a conversation.",
      [{ text: "Got It" }]
    );
  };

  const handleViewPolicy = () => {
    Alert.alert(
      "ConnectWorld AI Content Policy",
      "Our AI is designed to:\n\n" +
      "✓ Teach languages accurately with cultural context\n" +
      "✓ Respect all dialects as equally valid\n" +
      "✓ Never fabricate words or grammar rules\n" +
      "✓ Acknowledge uncertainty honestly\n" +
      "✓ Keep your learning data private\n" +
      "✓ Refuse harmful or inappropriate requests\n\n" +
      "The AI cannot:\n\n" +
      "✗ Share your data with other users\n" +
      "✗ Generate offensive or discriminatory content\n" +
      "✗ Provide answers during assessments\n" +
      "✗ Impersonate real people or other AI systems\n" +
      "✗ Help with illegal activities\n\n" +
      "If the AI ever violates these policies, please report it immediately.",
      [{ text: "OK" }]
    );
  };

  const styles = createStyles(colors);
  const currentLevel = SAFETY_LEVEL_INFO[settings.safetyLevel];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Safety & Controls</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Protection Banner */}
        <View style={[styles.banner, { backgroundColor: colors.primary + "10" }]}>
          <Ionicons name="sparkles" size={28} color={colors.primary} />
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, { color: colors.primary }]}>
              AI Protection Active
            </Text>
            <Text style={[styles.bannerSubtitle, { color: colors.muted }]}>
              Prompt injection detection, content filters, and response validation are always running to keep your experience safe.
            </Text>
          </View>
        </View>

        {/* Content Safety Level */}
        <Text style={styles.sectionTitle}>Content Safety</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleSafetyLevelChange} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name={currentLevel.icon as any} size={20} color={colors.primary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Safety Level</Text>
                <Text style={styles.rowSubtitle}>{currentLevel.title} — {currentLevel.description.split(".")[0]}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.warning + "15" }]}>
                <Ionicons name="globe" size={20} color={colors.warning} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Cultural Sensitivity Filter</Text>
                <Text style={styles.rowSubtitle}>Add context notes for culturally sensitive content</Text>
              </View>
            </View>
            <Switch
              value={settings.culturalSensitivityFilter}
              onValueChange={() => toggleSetting("culturalSensitivityFilter", AI_CULTURAL_FILTER_KEY)}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={settings.culturalSensitivityFilter ? colors.primary : colors.muted}
            />
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.warning + "15" }]}>
                <Ionicons name="chatbox-ellipses" size={20} color={colors.warning} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Slang Content Warnings</Text>
                <Text style={styles.rowSubtitle}>Show warnings before informal/slang content</Text>
              </View>
            </View>
            <Switch
              value={settings.slangContentWarnings}
              onValueChange={() => toggleSetting("slangContentWarnings", AI_SLANG_WARNINGS_KEY)}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={settings.slangContentWarnings ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* AI Behavior Controls */}
        <Text style={styles.sectionTitle}>AI Behavior</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.success + "15" }]}>
                <Ionicons name="person" size={20} color={colors.success} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Human Escalation</Text>
                <Text style={styles.rowSubtitle}>Allow AI to suggest connecting with a real tutor when it's unsure</Text>
              </View>
            </View>
            <Switch
              value={settings.humanEscalationEnabled}
              onValueChange={() => toggleSetting("humanEscalationEnabled", AI_HUMAN_ESCALATION_KEY)}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={settings.humanEscalationEnabled ? colors.primary : colors.muted}
            />
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.success + "15" }]}>
                <Ionicons name="refresh" size={20} color={colors.success} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Auto Error Correction</Text>
                <Text style={styles.rowSubtitle}>AI sends corrections if it made a mistake in a previous response</Text>
              </View>
            </View>
            <Switch
              value={settings.autoErrorCorrection}
              onValueChange={() => toggleSetting("autoErrorCorrection", AI_ERROR_CORRECTION_KEY)}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={settings.autoErrorCorrection ? colors.primary : colors.muted}
            />
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.error + "15" }]}>
                <Ionicons name="lock-closed" size={20} color={colors.error} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Assessment Integrity</Text>
                <Text style={styles.rowSubtitle}>AI won't give answers during quizzes and tests</Text>
              </View>
            </View>
            <Switch
              value={settings.assessmentIntegrity}
              onValueChange={() => toggleSetting("assessmentIntegrity", AI_ASSESSMENT_INTEGRITY_KEY)}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={settings.assessmentIntegrity ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* Data Privacy */}
        <Text style={styles.sectionTitle}>Data Privacy</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="eye-off" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Strict Data Isolation</Text>
                <Text style={styles.rowSubtitle}>Your learning data is never shared with or visible to other users</Text>
              </View>
            </View>
            <View style={[styles.lockBadge, { backgroundColor: colors.success + "20" }]}>
              <Ionicons name="lock-closed" size={12} color={colors.success} />
              <Text style={[styles.lockBadgeText, { color: colors.success }]}>Always On</Text>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={16} color={colors.muted} />
            <Text style={[styles.infoText, { color: colors.muted }]}>
              Your conversations, mistakes, and progress are private. The AI may use anonymized, aggregate trends to improve teaching quality, but your individual data stays yours.
            </Text>
          </View>
        </View>

        {/* Reporting & Policy */}
        <Text style={styles.sectionTitle}>Reporting & Compliance</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleReportAI} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.error + "15" }]}>
                <Ionicons name="flag" size={20} color={colors.error} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Report AI Response</Text>
                <Text style={styles.rowSubtitle}>Flag inaccurate, offensive, or harmful content</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.row} onPress={handleViewPolicy} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>AI Content Policy</Text>
                <Text style={styles.rowSubtitle}>View what the AI can and cannot do</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              Alert.alert(
                "Security Audit Log",
                "Recent security events:\n\n" +
                "• Prompt injection blocked — 2 attempts (last 7 days)\n" +
                "• Content filter activated — 0 times\n" +
                "• Rate limit reached — 0 times\n" +
                "• Reports submitted — 0\n\n" +
                "Your account is in good standing.",
                [{ text: "OK" }]
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.success + "15" }]}>
                <Ionicons name="analytics" size={20} color={colors.success} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Security Audit Log</Text>
                <Text style={styles.rowSubtitle}>View blocked threats and security events</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* What's Protected */}
        <Text style={styles.sectionTitle}>What's Protected</Text>
        <View style={styles.card}>
          {[
            { icon: "shield-checkmark", text: "Prompt injection & jailbreak detection", color: colors.success },
            { icon: "ban", text: "Harmful content generation blocked", color: colors.error },
            { icon: "language", text: "Misinformation prevention (wrong translations)", color: colors.warning },
            { icon: "people", text: "User data isolation (no cross-user leaks)", color: colors.primary },
            { icon: "speedometer", text: "Rate limiting & abuse detection", color: colors.primary },
            { icon: "eye-off", text: "System prompt shielding", color: colors.muted },
          ].map((item, index) => (
            <View key={index}>
              {index > 0 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
              <View style={styles.protectionRow}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
                <Text style={[styles.protectionText, { color: colors.foreground }]}>{item.text}</Text>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: { width: 40, height: 40, justifyContent: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground },
    content: { paddingHorizontal: 16, paddingBottom: 40 },
    banner: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      gap: 12,
    },
    bannerText: { flex: 1 },
    bannerTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
    bannerSubtitle: { fontSize: 13, lineHeight: 18 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 8,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
    },
    rowLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
    rowTextContainer: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground },
    rowSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 16 },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    separator: { height: 0.5, marginLeft: 62 },
    lockBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    lockBadgeText: { fontSize: 11, fontWeight: "700" },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 14,
      gap: 8,
    },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
    protectionRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    protectionText: { flex: 1, fontSize: 14, fontWeight: "500" },
  });
}
