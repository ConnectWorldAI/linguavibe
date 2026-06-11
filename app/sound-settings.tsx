/**
 * Sound & Haptics Settings Screen
 * 
 * Independent toggles for celebration sounds, haptics, and notification sounds.
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getSoundSettings,
  updateSoundSettings,
  resetSoundSettings,
  type SoundSettings,
} from "@/lib/sound-settings";

interface SettingRow {
  key: keyof SoundSettings;
  label: string;
  description: string;
  emoji: string;
}

const SETTING_ROWS: SettingRow[] = [
  {
    key: "celebrationSounds",
    label: "Celebration Sounds",
    description: "Play sounds when completing goals, earning badges, or hitting streak milestones",
    emoji: "🎉",
  },
  {
    key: "haptics",
    label: "Haptic Feedback",
    description: "Vibration feedback on button presses, achievements, and interactions",
    emoji: "📳",
  },
  {
    key: "notificationSounds",
    label: "Notification Sounds",
    description: "Sound alerts for push notifications and reminders",
    emoji: "🔔",
  },
];

export default function SoundSettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [settings, setSettings] = useState<SoundSettings>({
    celebrationSounds: true,
    haptics: true,
    notificationSounds: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await getSoundSettings();
    setSettings(s);
  };

  const handleToggle = async (key: keyof SoundSettings) => {
    const newValue = !settings[key];
    const updated = await updateSoundSettings({ [key]: newValue });
    setSettings(updated);

    // Give haptic feedback when toggling haptics ON (to demonstrate)
    if (key === "haptics" && newValue && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Sound Settings",
      "This will restore all sound and haptic settings to their defaults (all enabled).",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const defaults = await resetSoundSettings();
            setSettings(defaults);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="flex-1 p-5">
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.foreground }]}>Sound & Haptics</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Control celebration sounds, haptic feedback, and notification sounds independently.
      </Text>

      {/* Toggle Rows */}
      <View style={styles.settingsContainer}>
        {SETTING_ROWS.map((row) => (
          <View
            key={row.key}
            style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingEmoji}>{row.emoji}</Text>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>{row.label}</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>{row.description}</Text>
              </View>
            </View>
            <Switch
              value={settings[row.key]}
              onValueChange={() => handleToggle(row.key)}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={settings[row.key] ? colors.primary : colors.muted}
            />
          </View>
        ))}
      </View>

      {/* Status Summary */}
      <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.statusTitle, { color: colors.foreground }]}>Current Status</Text>
        <View style={styles.statusRow}>
          <Text style={[styles.statusItem, { color: settings.celebrationSounds ? colors.success : colors.error }]}>
            {settings.celebrationSounds ? "🔊" : "🔇"} Celebrations {settings.celebrationSounds ? "ON" : "OFF"}
          </Text>
          <Text style={[styles.statusItem, { color: settings.haptics ? colors.success : colors.error }]}>
            {settings.haptics ? "📳" : "⬜"} Haptics {settings.haptics ? "ON" : "OFF"}
          </Text>
          <Text style={[styles.statusItem, { color: settings.notificationSounds ? colors.success : colors.error }]}>
            {settings.notificationSounds ? "🔔" : "🔕"} Notifications {settings.notificationSounds ? "ON" : "OFF"}
          </Text>
        </View>
      </View>

      {/* Reset Button */}
      <TouchableOpacity
        onPress={handleReset}
        style={[styles.resetButton, { borderColor: colors.error }]}
      >
        <Text style={[styles.resetText, { color: colors.error }]}>Reset to Defaults</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: "500" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  settingsContainer: { gap: 12 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 },
  settingEmoji: { fontSize: 24, marginRight: 12 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  settingDesc: { fontSize: 12, lineHeight: 16 },
  statusCard: { marginTop: 24, padding: 16, borderRadius: 14, borderWidth: 1 },
  statusTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  statusRow: { gap: 6 },
  statusItem: { fontSize: 13, fontWeight: "500" },
  resetButton: { marginTop: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, alignItems: "center" },
  resetText: { fontSize: 15, fontWeight: "600" },
});
