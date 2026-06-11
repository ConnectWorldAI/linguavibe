import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppLock } from "@/lib/app-lock";

const STORAGE_KEY = "privacy_settings";
const BLOCKED_USERS_KEY = "@linguavibe_blocked_users";

type PrivacySettings = {
  accountPrivate: boolean;
  hideProfilePhoto: boolean;
  onlineStatus: "online" | "offline" | "hidden";
  profilePhotoVisibility: "everyone" | "friends" | "classmates" | "nobody";
  whoCanMessage: "everyone" | "followers" | "nobody";
  whoCanSeePosts: "everyone" | "followers" | "custom";
  whoCanAddToClasses: "everyone" | "friends" | "nobody";
  progressVisibility: "everyone" | "friends" | "classmates" | "nobody";
  showActivityStatus: boolean;
  showReadReceipts: boolean;
  allowTagging: boolean;
  showInSuggestions: boolean;
  shareDataForImprovement: boolean;
  classmateSeePersonal: boolean;
  friendsSeeCareer: boolean;
  disappearingMessages: "off" | "24h" | "7d" | "90d";
  allowCameraEffects: boolean;
};

const DEFAULT_SETTINGS: PrivacySettings = {
  accountPrivate: false,
  hideProfilePhoto: false,
  onlineStatus: "online",
  profilePhotoVisibility: "everyone",
  whoCanMessage: "everyone",
  whoCanSeePosts: "everyone",
  whoCanAddToClasses: "everyone",
  progressVisibility: "friends",
  showActivityStatus: true,
  showReadReceipts: true,
  allowTagging: true,
  showInSuggestions: true,
  shareDataForImprovement: true,
  classmateSeePersonal: false,
  friendsSeeCareer: true,
  disappearingMessages: "off",
  allowCameraEffects: true,
};

export default function PrivacySettingsScreen() {
  const colors = useColors();
  const { isLockEnabled, biometricType, toggleLock, lockTimeout, setLockTimeout } = useAppLock();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    loadSettings();
    loadBlockedCount();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {}
  };

  const loadBlockedCount = async () => {
    try {
      const blocked = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
      if (blocked) setBlockedCount(JSON.parse(blocked).length);
    } catch {}
  };

  const saveSettings = async (updated: PrivacySettings) => {
    setSettings(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const toggleSetting = (key: keyof PrivacySettings) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...settings, [key]: !settings[key] };
    saveSettings(updated);
  };

  const setOption = (key: keyof PrivacySettings, value: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...settings, [key]: value };
    saveSettings(updated);
  };

  // ─── Renderers ─────────────────────────────────────────────────────────────

  const renderToggleRow = (
    icon: string,
    title: string,
    description: string,
    value: boolean,
    onToggle: () => void,
    iconColor: string = colors.primary
  ) => (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: iconColor + "15" }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.rowDesc, { color: colors.muted }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + "60" }}
        thumbColor={value ? colors.primary : colors.muted}
      />
    </View>
  );

  const renderNavRow = (
    icon: string,
    title: string,
    value: string,
    onPress: () => void,
    iconColor: string = colors.primary
  ) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconColor + "15" }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <Text style={[styles.navValue, { color: colors.muted }]}>{value}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );

  const renderOptionRow = (
    icon: string,
    title: string,
    options: { value: string; label: string }[],
    key: keyof PrivacySettings,
    iconColor: string = colors.primary
  ) => (
    <View style={[styles.optionSection, { borderBottomColor: colors.border }]}>
      <View style={styles.optionHeader}>
        <View style={[styles.rowIcon, { backgroundColor: iconColor + "15" }]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <View style={styles.optionsRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionChip,
              {
                backgroundColor: settings[key] === opt.value ? colors.primary + "15" : colors.surface,
                borderColor: settings[key] === opt.value ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setOption(key, opt.value)}
          >
            <Text
              style={[
                styles.optionText,
                { color: settings[key] === opt.value ? colors.primary : colors.muted },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ─── Privacy Checkup Banner ────────────────────────────────────────────────

  const [showCheckupBanner, setShowCheckupBanner] = useState(true);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Privacy Checkup Banner */}
        {showCheckupBanner && (
          <View style={[styles.checkupBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.checkupLeft}>
              <Ionicons name="shield-checkmark" size={24} color="#00B894" />
            </View>
            <View style={styles.checkupContent}>
              <Text style={[styles.checkupTitle, { color: colors.foreground }]}>Privacy Checkup</Text>
              <Text style={[styles.checkupDesc, { color: colors.muted }]}>
                Control your privacy and choose the right settings for you.{" "}
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Start checkup</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowCheckupBanner(false)} style={styles.checkupClose}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Who Can See Your Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Who Can See Your Info</Text>

          {renderOptionRow(
            "radio-outline",
            "Last Seen & Online",
            [
              { value: "online", label: "Everyone" },
              { value: "offline", label: "Friends Only" },
              { value: "hidden", label: "Nobody" },
            ],
            "onlineStatus",
            "#0984E3"
          )}

          {renderOptionRow(
            "person-circle-outline",
            "Profile Photo",
            [
              { value: "everyone", label: "Everyone" },
              { value: "friends", label: "Friends" },
              { value: "classmates", label: "Classmates" },
              { value: "nobody", label: "Nobody" },
            ],
            "profilePhotoVisibility",
            "#E17055"
          )}

          {renderOptionRow(
            "trophy-outline",
            "Learning Progress",
            [
              { value: "everyone", label: "Everyone" },
              { value: "friends", label: "Friends" },
              { value: "classmates", label: "Classmates" },
              { value: "nobody", label: "Nobody" },
            ],
            "progressVisibility",
            "#FDCB6E"
          )}

          {renderOptionRow(
            "people-outline",
            "Who Can Add Me to Classes",
            [
              { value: "everyone", label: "Everyone" },
              { value: "friends", label: "Friends Only" },
              { value: "nobody", label: "Nobody" },
            ],
            "whoCanAddToClasses",
            "#6C5CE7"
          )}
        </View>

        {/* Communication */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Communication</Text>

          {renderOptionRow(
            "chatbubble-outline",
            "Who Can Message You",
            [
              { value: "everyone", label: "Everyone" },
              { value: "followers", label: "Friends Only" },
              { value: "nobody", label: "Nobody" },
            ],
            "whoCanMessage",
            "#0984E3"
          )}

          {renderToggleRow(
            "checkmark-done-outline",
            "Read Receipts",
            "If you turn this off, you won't be able to see read receipts from others either.",
            settings.showReadReceipts,
            () => toggleSetting("showReadReceipts"),
            "#0984E3"
          )}

          {renderToggleRow(
            "pricetag-outline",
            "Allow Tagging",
            "Let others tag you in posts and comments",
            settings.allowTagging,
            () => toggleSetting("allowTagging"),
            "#FDCB6E"
          )}
        </View>

        {/* Disappearing Messages */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Disappearing Messages</Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            Start new conversations with disappearing messages set to your timer.
          </Text>
          {renderOptionRow(
            "timer-outline",
            "Default Message Timer",
            [
              { value: "off", label: "Off" },
              { value: "24h", label: "24 Hours" },
              { value: "7d", label: "7 Days" },
              { value: "90d", label: "90 Days" },
            ],
            "disappearingMessages",
            "#636E72"
          )}
        </View>

        {/* App Security */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>App Security</Text>

          {renderNavRow(
            "lock-closed-outline",
            "App Lock",
            isLockEnabled ? `On (${biometricType || "Biometrics"})` : "Off",
            () => toggleLock(),
            "#6C5CE7"
          )}

          {isLockEnabled && (
            <View style={[styles.lockTimeoutSection, { borderBottomColor: colors.border }]}>
              <Text style={[styles.lockTimeoutLabel, { color: colors.muted }]}>
                Lock after:
              </Text>
              <View style={styles.optionsRow}>
                {[
                  { value: 0, label: "Immediately" },
                  { value: 60, label: "1 min" },
                  { value: 300, label: "5 min" },
                  { value: 900, label: "15 min" },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: lockTimeout === opt.value ? colors.primary + "15" : colors.surface,
                        borderColor: lockTimeout === opt.value ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setLockTimeout(opt.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: lockTimeout === opt.value ? colors.primary : colors.muted },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {renderNavRow(
            "ban-outline",
            "Blocked Users",
            `${blockedCount} blocked`,
            () => router.push("/blocked-users" as any),
            "#FF6B6B"
          )}
        </View>

        {/* Dual Profile */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dual Profile</Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            Control what classmates and friends can see across your professional and personal profiles.
          </Text>
          {renderToggleRow(
            "school-outline",
            "Classmates See Personal",
            "Allow classmates/teachers to view your personal posts",
            settings.classmateSeePersonal,
            () => toggleSetting("classmateSeePersonal"),
            "#6C5CE7"
          )}
          {renderToggleRow(
            "people-outline",
            "Friends See Career",
            "Allow personal friends to view your career/certifications",
            settings.friendsSeeCareer,
            () => toggleSetting("friendsSeeCareer"),
            "#00B894"
          )}
        </View>

        {/* Advanced */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Advanced</Text>

          {renderToggleRow(
            "camera-outline",
            "Allow Camera Effects",
            "Use effects in the camera and video calls",
            settings.allowCameraEffects,
            () => toggleSetting("allowCameraEffects"),
            "#A29BFE"
          )}

          {renderToggleRow(
            "eye-outline",
            "Show in Suggestions",
            "Appear in 'People You May Know' and connection suggestions",
            settings.showInSuggestions,
            () => toggleSetting("showInSuggestions"),
            "#00B894"
          )}

          {renderToggleRow(
            "analytics-outline",
            "Share Usage Data",
            "Help improve ConnectWorld AI by sharing anonymous usage patterns",
            settings.shareDataForImprovement,
            () => toggleSetting("shareDataForImprovement"),
            "#636E72"
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  sectionDesc: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowContent: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  navValue: { fontSize: 13, fontWeight: "500" },
  optionSection: { paddingVertical: 14, borderBottomWidth: 0.5 },
  optionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  optionsRow: { flexDirection: "row", gap: 8, paddingLeft: 46, flexWrap: "wrap" },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionText: { fontSize: 13, fontWeight: "600" },
  checkupBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  checkupLeft: { marginRight: 12, marginTop: 2 },
  checkupContent: { flex: 1 },
  checkupTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  checkupDesc: { fontSize: 13, lineHeight: 18 },
  checkupClose: { padding: 4 },
  lockTimeoutSection: {
    paddingVertical: 12,
    paddingLeft: 46,
    borderBottomWidth: 0.5,
  },
  lockTimeoutLabel: { fontSize: 13, marginBottom: 8 },
});
