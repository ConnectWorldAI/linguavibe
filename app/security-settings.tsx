import { useState, useEffect, useCallback } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useAppLock } from "@/lib/app-lock";
import { trpc } from "@/lib/trpc";

// Storage keys
const LOGIN_ALERTS_KEY = "@connectworld_login_alerts";
const ACTIVE_SESSIONS_KEY = "@connectworld_active_sessions";
const SECURITY_LOG_KEY = "@connectworld_security_log";

type ActiveSession = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
};

type SecurityLogEntry = {
  id: string;
  event: string;
  timestamp: string;
  device: string;
  success: boolean;
};

type MFASetupState = "idle" | "loading" | "qr_shown" | "verifying" | "complete";

export default function SecuritySettingsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { isLockEnabled, biometricType, toggleLock } = useAppLock();

  // MFA state from server
  const mfaStatus = trpc.mfa.status.useQuery();
  const setupStartMutation = trpc.mfa.setupStart.useMutation();
  const setupVerifyMutation = trpc.mfa.setupVerify.useMutation();
  const disableMutation = trpc.mfa.disable.useMutation();
  const regenerateCodesMutation = trpc.mfa.regenerateBackupCodes.useMutation();

  const [mfaSetupState, setMfaSetupState] = useState<MFASetupState>("idle");
  const [totpSecret, setTotpSecret] = useState<string>("");
  const [otpauthUri, setOtpauthUri] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disableCode, setDisableCode] = useState<string>("");

  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [securityLog, setSecurityLog] = useState<SecurityLogEntry[]>([]);

  useEffect(() => {
    loadLocalState();
  }, []);

  const loadLocalState = async () => {
    try {
      const [alerts, sessionsData, logData] = await Promise.all([
        AsyncStorage.getItem(LOGIN_ALERTS_KEY),
        AsyncStorage.getItem(ACTIVE_SESSIONS_KEY),
        AsyncStorage.getItem(SECURITY_LOG_KEY),
      ]);
      setLoginAlertsEnabled(alerts !== "false");
      setSessions(sessionsData ? JSON.parse(sessionsData) : getDefaultSessions());
      setSecurityLog(logData ? JSON.parse(logData) : getDefaultLog());
    } catch {}
  };

  const getDefaultSessions = (): ActiveSession[] => [
    { id: "1", device: "iPhone 15 Pro", location: "Columbus, OH", lastActive: "Now", isCurrent: true },
    { id: "2", device: "MacBook Pro", location: "Columbus, OH", lastActive: "2 hours ago", isCurrent: false },
  ];

  const getDefaultLog = (): SecurityLogEntry[] => [
    { id: "1", event: "Login", timestamp: "Today, 9:30 AM", device: "iPhone 15 Pro", success: true },
    { id: "2", event: "Password Changed", timestamp: "3 days ago", device: "MacBook Pro", success: true },
    { id: "3", event: "Login Attempt", timestamp: "1 week ago", device: "Unknown Device", success: false },
  ];

  // ─── MFA Setup Flow ─────────────────────────────────────────────────────────
  const handleStartMFASetup = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMfaSetupState("loading");
    try {
      const result = await setupStartMutation.mutateAsync({
        email: user?.email ?? undefined,
      });
      setTotpSecret(result.secret);
      setOtpauthUri(result.otpauthUri);
      setMfaSetupState("qr_shown");
    } catch (err: any) {
      setMfaSetupState("idle");
      Alert.alert("Setup Failed", err.message || "Could not start MFA setup. Try again.");
    }
  }, [user]);

  const handleVerifySetup = useCallback(async () => {
    if (verificationCode.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code from your authenticator app.");
      return;
    }
    setMfaSetupState("verifying");
    try {
      const result = await setupVerifyMutation.mutateAsync({ code: verificationCode });
      if (result.success) {
        setBackupCodes(result.backupCodes || []);
        setMfaSetupState("complete");
        mfaStatus.refetch();
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setMfaSetupState("qr_shown");
        Alert.alert("Verification Failed", result.error || "Invalid code. Please try again.");
      }
    } catch (err: any) {
      setMfaSetupState("qr_shown");
      Alert.alert("Error", err.message || "Verification failed.");
    }
  }, [verificationCode]);

  const handleDisableMFA = useCallback(() => {
    Alert.prompt
      ? Alert.prompt(
          "Disable MFA",
          "Enter your current authenticator code to disable MFA:",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Disable",
              style: "destructive",
              onPress: async (code?: string) => {
                if (!code || code.length !== 6) {
                  Alert.alert("Invalid Code", "Please enter a valid 6-digit code.");
                  return;
                }
                try {
                  const result = await disableMutation.mutateAsync({ code });
                  if (result.success) {
                    mfaStatus.refetch();
                    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert("MFA Disabled", "Two-factor authentication has been removed from your account.");
                  } else {
                    Alert.alert("Failed", result.error || "Could not disable MFA.");
                  }
                } catch (err: any) {
                  Alert.alert("Error", err.message || "Failed to disable MFA.");
                }
              },
            },
          ],
          "plain-text"
        )
      : Alert.alert(
          "Disable MFA",
          "Enter your authenticator code below and tap Disable.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Disable",
              style: "destructive",
              onPress: async () => {
                if (disableCode.length !== 6) {
                  Alert.alert("Invalid Code", "Please enter a valid 6-digit code.");
                  return;
                }
                try {
                  const result = await disableMutation.mutateAsync({ code: disableCode });
                  if (result.success) {
                    mfaStatus.refetch();
                    setDisableCode("");
                    Alert.alert("MFA Disabled", "Two-factor authentication has been removed.");
                  } else {
                    Alert.alert("Failed", result.error || "Could not disable MFA.");
                  }
                } catch (err: any) {
                  Alert.alert("Error", err.message || "Failed to disable MFA.");
                }
              },
            },
          ]
        );
  }, [disableCode]);

  const handleRegenerateBackupCodes = useCallback(() => {
    Alert.prompt
      ? Alert.prompt(
          "Regenerate Backup Codes",
          "Enter your authenticator code to generate new backup codes:",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Regenerate",
              onPress: async (code?: string) => {
                if (!code || code.length !== 6) return;
                try {
                  const result = await regenerateCodesMutation.mutateAsync({ code });
                  if (result.success) {
                    setBackupCodes(result.backupCodes || []);
                    Alert.alert("New Backup Codes", (result.backupCodes || []).join("\n"));
                  } else {
                    Alert.alert("Failed", result.error || "Could not regenerate codes.");
                  }
                } catch (err: any) {
                  Alert.alert("Error", err.message || "Failed to regenerate.");
                }
              },
            },
          ],
          "plain-text"
        )
      : Alert.alert("Regenerate Backup Codes", "Use the code input field below, then tap Regenerate.");
  }, []);

  // ─── Session & Alert handlers ───────────────────────────────────────────────
  const toggleLoginAlerts = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = !loginAlertsEnabled;
    setLoginAlertsEnabled(newVal);
    await AsyncStorage.setItem(LOGIN_ALERTS_KEY, String(newVal));
  };

  const handleRevokeSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session?.isCurrent) {
      Alert.alert("Cannot Revoke", "You cannot revoke your current session.");
      return;
    }
    Alert.alert("Revoke Session?", `This will log out "${session?.device}" in ${session?.location}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke",
        style: "destructive",
        onPress: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        },
      },
    ]);
  };

  const handleRevokeAllSessions = () => {
    Alert.alert("Revoke All Other Sessions?", "This will log you out of all other devices.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke All",
        style: "destructive",
        onPress: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSessions((prev) => prev.filter((s) => s.isCurrent));
        },
      },
    ]);
  };

  const isMFAEnabled = mfaStatus.data?.enabled ?? false;
  const styles = createStyles(colors);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security Score Banner */}
        <View style={[styles.securityBanner, { backgroundColor: isMFAEnabled ? colors.success + "15" : colors.warning + "15" }]}>
          <Ionicons
            name={isMFAEnabled ? "shield-checkmark" : "shield-half"}
            size={32}
            color={isMFAEnabled ? colors.success : colors.warning}
          />
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, { color: isMFAEnabled ? colors.success : colors.warning }]}>
              {isMFAEnabled ? "Account Protected" : "Improve Your Security"}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: colors.muted }]}>
              {isMFAEnabled
                ? `MFA active · ${mfaStatus.data?.backupCodesRemaining ?? 0} backup codes remaining`
                : "Enable MFA to protect your account from unauthorized access"}
            </Text>
          </View>
        </View>

        {/* Two-Factor Authentication */}
        <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
        <View style={styles.card}>
          {/* MFA Status Row */}
          <TouchableOpacity
            style={styles.row}
            onPress={isMFAEnabled ? handleDisableMFA : handleStartMFASetup}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="key" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Authenticator App</Text>
                <Text style={styles.rowSubtitle}>
                  {isMFAEnabled ? "Active — TOTP Authenticator" : "Set up two-factor authentication"}
                </Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <View style={[styles.statusBadge, { backgroundColor: isMFAEnabled ? colors.success + "20" : colors.error + "20" }]}>
                <Text style={[styles.statusText, { color: isMFAEnabled ? colors.success : colors.error }]}>
                  {isMFAEnabled ? "ON" : "OFF"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
          </TouchableOpacity>

          {/* MFA Setup Flow (inline) */}
          {mfaSetupState === "loading" && (
            <View style={styles.setupSection}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.setupText, { color: colors.muted }]}>Generating secret...</Text>
            </View>
          )}

          {mfaSetupState === "qr_shown" && (
            <View style={styles.setupSection}>
              <Text style={[styles.setupTitle, { color: colors.foreground }]}>Scan with Authenticator</Text>
              <Text style={[styles.setupText, { color: colors.muted }]}>
                Open Google Authenticator, Authy, or any TOTP app and scan the code below, or enter the key manually.
              </Text>

              {/* QR Code placeholder — shows the URI for manual entry */}
              <View style={[styles.qrContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="qr-code" size={80} color={colors.primary} />
                <Text style={[styles.qrHint, { color: colors.muted }]}>
                  Scan this QR code in your authenticator app
                </Text>
              </View>

              {/* Manual key */}
              <View style={[styles.manualKeyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.manualKeyLabel, { color: colors.muted }]}>Manual Entry Key:</Text>
                <Text style={[styles.manualKeyValue, { color: colors.foreground }]} selectable>
                  {totpSecret}
                </Text>
              </View>

              {/* Verification input */}
              <Text style={[styles.setupText, { color: colors.foreground, marginTop: 16, fontWeight: "600" }]}>
                Enter the 6-digit code from your app:
              </Text>
              <TextInput
                style={[styles.codeInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={verificationCode}
                onChangeText={(t) => setVerificationCode(t.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleVerifySetup}
              />
              <TouchableOpacity
                style={[styles.verifyButton, { backgroundColor: colors.primary, opacity: verificationCode.length === 6 ? 1 : 0.5 }]}
                onPress={handleVerifySetup}
                disabled={verificationCode.length !== 6}
                activeOpacity={0.8}
              >
                {setupVerifyMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify & Enable MFA</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMfaSetupState("idle")} style={styles.cancelLink}>
                <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel Setup</Text>
              </TouchableOpacity>
            </View>
          )}

          {mfaSetupState === "complete" && (
            <View style={styles.setupSection}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={[styles.setupTitle, { color: colors.success }]}>MFA Enabled Successfully</Text>
              <Text style={[styles.setupText, { color: colors.muted }]}>
                Save these backup codes in a safe place. You'll need them if you lose access to your authenticator app.
              </Text>
              <View style={[styles.backupCodesBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {backupCodes.map((code, i) => (
                  <Text key={i} style={[styles.backupCode, { color: colors.foreground }]} selectable>
                    {code}
                  </Text>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.verifyButton, { backgroundColor: colors.primary }]}
                onPress={() => setMfaSetupState("idle")}
                activeOpacity={0.8}
              >
                <Text style={styles.verifyButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          {/* Backup Codes */}
          {isMFAEnabled && (
            <>
              <TouchableOpacity style={styles.row} onPress={handleRegenerateBackupCodes} activeOpacity={0.7}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.warning + "15" }]}>
                    <Ionicons name="document-text" size={20} color={colors.warning} />
                  </View>
                  <View style={styles.rowTextContainer}>
                    <Text style={styles.rowTitle}>Backup Codes</Text>
                    <Text style={styles.rowSubtitle}>
                      {mfaStatus.data?.backupCodesRemaining ?? 0} codes remaining
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </TouchableOpacity>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
            </>
          )}

          {/* Login Alerts */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="notifications" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Login Alerts</Text>
                <Text style={styles.rowSubtitle}>Get notified of new sign-ins</Text>
              </View>
            </View>
            <Switch
              value={loginAlertsEnabled}
              onValueChange={toggleLoginAlerts}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={loginAlertsEnabled ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* App Lock */}
        <Text style={styles.sectionTitle}>Device Security</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="lock-closed" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>App Lock</Text>
                <Text style={styles.rowSubtitle}>
                  {isLockEnabled ? `Locked with ${biometricType || "PIN"}` : "Require authentication to open app"}
                </Text>
              </View>
            </View>
            <Switch
              value={isLockEnabled}
              onValueChange={toggleLock}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={isLockEnabled ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* Active Sessions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Sessions</Text>
          {sessions.length > 1 && (
            <TouchableOpacity onPress={handleRevokeAllSessions}>
              <Text style={[styles.revokeAllText, { color: colors.error }]}>Revoke All</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.card}>
          {sessions.map((session, index) => (
            <View key={session.id}>
              {index > 0 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
              <TouchableOpacity style={styles.sessionRow} onPress={() => handleRevokeSession(session.id)} activeOpacity={0.7}>
                <View style={[styles.iconCircle, { backgroundColor: session.isCurrent ? colors.success + "15" : colors.surface }]}>
                  <Ionicons
                    name={session.device.includes("iPhone") ? "phone-portrait" : "laptop"}
                    size={20}
                    color={session.isCurrent ? colors.success : colors.muted}
                  />
                </View>
                <View style={styles.sessionInfo}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.rowTitle}>{session.device}</Text>
                    {session.isCurrent && (
                      <View style={[styles.currentBadge, { backgroundColor: colors.success + "20" }]}>
                        <Text style={[styles.currentBadgeText, { color: colors.success }]}>Current</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.rowSubtitle}>{session.location} · {session.lastActive}</Text>
                </View>
                {!session.isCurrent && <Ionicons name="close-circle" size={22} color={colors.error + "80"} />}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Security Log */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.card}>
          {securityLog.map((entry, index) => (
            <View key={entry.id}>
              {index > 0 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
              <View style={styles.logRow}>
                <View style={[styles.logDot, { backgroundColor: entry.success ? colors.success : colors.error }]} />
                <View style={styles.logInfo}>
                  <Text style={styles.rowTitle}>{entry.event}</Text>
                  <Text style={styles.rowSubtitle}>{entry.device} · {entry.timestamp}</Text>
                </View>
                <Ionicons
                  name={entry.success ? "checkmark-circle" : "alert-circle"}
                  size={20}
                  color={entry.success ? colors.success : colors.error}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Disable MFA code input (for platforms without Alert.prompt) */}
        {isMFAEnabled && Platform.OS !== "ios" && (
          <>
            <Text style={styles.sectionTitle}>Disable MFA</Text>
            <View style={styles.card}>
              <View style={[styles.setupSection, { paddingVertical: 12 }]}>
                <Text style={[styles.setupText, { color: colors.muted }]}>
                  Enter your authenticator code to disable MFA:
                </Text>
                <TextInput
                  style={[styles.codeInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={disableCode}
                  onChangeText={(t) => setDisableCode(t.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[styles.verifyButton, { backgroundColor: colors.error, opacity: disableCode.length === 6 ? 1 : 0.5 }]}
                  onPress={async () => {
                    if (disableCode.length !== 6) return;
                    try {
                      const result = await disableMutation.mutateAsync({ code: disableCode });
                      if (result.success) {
                        mfaStatus.refetch();
                        setDisableCode("");
                        Alert.alert("MFA Disabled", "Two-factor authentication has been removed.");
                      } else {
                        Alert.alert("Failed", result.error || "Invalid code.");
                      }
                    } catch (err: any) {
                      Alert.alert("Error", err.message || "Failed to disable MFA.");
                    }
                  }}
                  disabled={disableCode.length !== 6}
                  activeOpacity={0.8}
                >
                  <Text style={styles.verifyButtonText}>Disable MFA</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

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
    securityBanner: {
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
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      marginBottom: 8,
    },
    revokeAllText: { fontSize: 13, fontWeight: "600" },
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
    rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    rowTextContainer: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground },
    rowSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    separator: { height: 0.5, marginLeft: 62 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: "700" },
    sessionRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    sessionInfo: { flex: 1 },
    sessionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    currentBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    currentBadgeText: { fontSize: 10, fontWeight: "700" },
    logRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    logDot: { width: 8, height: 8, borderRadius: 4 },
    logInfo: { flex: 1 },
    // MFA Setup styles
    setupSection: {
      padding: 16,
      alignItems: "center",
      gap: 12,
    },
    setupTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
    setupText: { fontSize: 13, textAlign: "center", lineHeight: 18 },
    qrContainer: {
      width: 180,
      height: 180,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 8,
    },
    qrHint: { fontSize: 11, marginTop: 8, textAlign: "center" },
    manualKeyBox: {
      width: "100%",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: "center",
    },
    manualKeyLabel: { fontSize: 11, marginBottom: 4 },
    manualKeyValue: { fontSize: 14, fontWeight: "700", letterSpacing: 1.5, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
    codeInput: {
      width: "100%",
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center",
      letterSpacing: 8,
    },
    verifyButton: {
      width: "100%",
      height: 44,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    verifyButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    cancelLink: { paddingVertical: 8 },
    cancelText: { fontSize: 13 },
    backupCodesBox: {
      width: "100%",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
    },
    backupCode: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
  });
}
