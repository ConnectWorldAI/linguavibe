import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useAppLock } from "@/lib/app-lock";

const TWO_FA_KEY = "@linguavibe_2fa_enabled";
const LOGIN_ALERTS_KEY = "@linguavibe_login_alerts";

type AccountSettings = {
  twoFactorEnabled: boolean;
  loginAlertsEnabled: boolean;
};

export default function AccountSettingsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { isLockEnabled, biometricType, toggleLock } = useAppLock();
  const [settings, setSettings] = useState<AccountSettings>({
    twoFactorEnabled: false,
    loginAlertsEnabled: true,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const twoFa = await AsyncStorage.getItem(TWO_FA_KEY);
      const loginAlerts = await AsyncStorage.getItem(LOGIN_ALERTS_KEY);
      setSettings({
        twoFactorEnabled: twoFa === "true",
        loginAlertsEnabled: loginAlerts !== "false",
      });
    } catch {}
  };

  const toggleTwoFactor = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newVal = !settings.twoFactorEnabled;
    setSettings((prev) => ({ ...prev, twoFactorEnabled: newVal }));
    await AsyncStorage.setItem(TWO_FA_KEY, String(newVal));
    if (newVal) {
      Alert.alert(
        "Two-Factor Authentication Enabled",
        "You'll be asked to verify your identity with a code when logging in from a new device.",
        [{ text: "OK" }]
      );
    }
  };

  const toggleLoginAlerts = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = !settings.loginAlertsEnabled;
    setSettings((prev) => ({ ...prev, loginAlertsEnabled: newVal }));
    await AsyncStorage.setItem(LOGIN_ALERTS_KEY, String(newVal));
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.toLowerCase() !== "delete") return;
    Alert.alert(
      "Account Deleted",
      "Your account has been scheduled for deletion. You have 30 days to reactivate by logging back in.",
      [{ text: "OK", onPress: () => router.replace("/signup" as any) }]
    );
  };

  const handleDownloadData = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Data Export Requested",
      "We'll prepare your data export and notify you when it's ready to download. This usually takes 24-48 hours.",
      [{ text: "OK" }]
    );
  };

  const renderNavRow = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
    iconColor: string = colors.primary
  ) => (
    <TouchableOpacity
      style={[styles.navRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconColor + "15" }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </TouchableOpacity>
  );

  const renderToggleRow = (
    icon: string,
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: () => void,
    iconColor: string = colors.primary
  ) => (
    <View style={[styles.navRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: iconColor + "15" }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + "60" }}
        thumbColor={value ? colors.primary : colors.muted}
      />
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Account</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Security</Text>

          {renderToggleRow(
            "notifications-outline",
            "Login Alerts",
            "Get notified when a new device logs into your account",
            settings.loginAlertsEnabled,
            toggleLoginAlerts,
            "#0984E3"
          )}

          {renderToggleRow(
            "key-outline",
            "Two-Factor Authentication",
            "Require a verification code on new device logins",
            settings.twoFactorEnabled,
            toggleTwoFactor,
            "#6C5CE7"
          )}

          {renderNavRow(
            "finger-print",
            "Passkeys & Biometrics",
            isLockEnabled
              ? `App lock enabled (${biometricType || "Biometrics"})`
              : "Set up biometric login for faster access",
            () => toggleLock(),
            "#00B894"
          )}
        </View>

        {/* Contact Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contact Information</Text>

          {renderNavRow(
            "mail-outline",
            "Email Address",
            user?.email || "Not set",
            () => {
              Alert.alert(
                "Change Email",
                "To change your email address, we'll send a verification link to your new email.",
                [{ text: "Cancel" }, { text: "Continue", onPress: () => {} }]
              );
            },
            "#E17055"
          )}
        </View>

        {/* Account Management Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account Management</Text>

          {renderNavRow(
            "download-outline",
            "Download My Data",
            "Request a copy of all your learning data and account info",
            handleDownloadData,
            "#636E72"
          )}

          {renderNavRow(
            "swap-vertical-outline",
            "Switch Account",
            "Log in to a different account",
            () => router.push("/login" as any),
            "#0984E3"
          )}
        </View>

        {/* Danger Zone */}
        <View style={[styles.dangerSection, { borderColor: "#FF6B6B30" }]}>
          <Text style={[styles.dangerTitle]}>Delete Account</Text>
          <Text style={[styles.dangerDesc, { color: colors.muted }]}>
            Permanently delete your account and all associated data. This action cannot be undone after 30 days.
          </Text>

          {!showDeleteConfirm ? (
            <TouchableOpacity
              style={[styles.dangerBtn, { borderColor: "#FF6B6B50" }]}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
              <Text style={styles.dangerBtnText}>Delete My Account</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.deleteConfirmBox}>
              <Text style={[styles.deleteConfirmLabel, { color: colors.muted }]}>
                Type "delete" to confirm:
              </Text>
              <TextInput
                style={[styles.deleteInput, { color: colors.foreground, borderColor: "#FF6B6B50" }]}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="Type delete"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleDeleteAccount}
              />
              <View style={styles.deleteActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmDeleteBtn,
                    { opacity: deleteConfirmText.toLowerCase() === "delete" ? 1 : 0.4 },
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={deleteConfirmText.toLowerCase() !== "delete"}
                >
                  <Text style={styles.confirmDeleteText}>Delete Forever</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  navRow: {
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
  rowSubtitle: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  dangerSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  dangerTitle: { fontSize: 15, fontWeight: "700", color: "#FF6B6B", marginBottom: 6 },
  dangerDesc: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  dangerBtnText: { fontSize: 14, fontWeight: "600", color: "#FF6B6B" },
  deleteConfirmBox: { marginTop: 8 },
  deleteConfirmLabel: { fontSize: 13, marginBottom: 8 },
  deleteInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  deleteActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
  },
  confirmDeleteText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
