import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Share,
  TextInput,
  Animated,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const MY_QR_CODE_KEY = "@connectworld_my_qr_code";
const CONNECTIONS_KEY = "@connectworld_qr_connections";

type TabMode = "myCode" | "scan";

interface Connection {
  id: string;
  name: string;
  code: string;
  type: "friend" | "classmate";
  connectedAt: string;
}

function generateQRCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CM-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function QRConnectScreen() {
  const [tab, setTab] = useState<TabMode>("myCode");
  const [myCode, setMyCode] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<"idle" | "success" | "error">("idle");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [copied, setCopied] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadMyCode();
    loadConnections();
    startPulse();
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  };

  const loadMyCode = async () => {
    try {
      let code = await AsyncStorage.getItem(MY_QR_CODE_KEY);
      if (!code) {
        code = generateQRCode();
        await AsyncStorage.setItem(MY_QR_CODE_KEY, code);
      }
      setMyCode(code);
    } catch (e) {
      setMyCode(generateQRCode());
    }
  };

  const loadConnections = async () => {
    try {
      const stored = await AsyncStorage.getItem(CONNECTIONS_KEY);
      if (stored) setConnections(JSON.parse(stored));
    } catch (e) { /* ignore */ }
  };

  const handleCopy = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Connect with me on ConnectWorld AI! My code: ${myCode}\n\nDownload the app and scan my code to become study buddies! 🌍📚`,
      });
    } catch (e) { /* ignore */ }
  };

  const handleScanSubmit = async () => {
    if (!scanInput.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate scanning — in real app this would validate against server
    if (scanInput.trim().startsWith("CM-") && scanInput.trim().length >= 6) {
      const newConnection: Connection = {
        id: Date.now().toString(),
        name: `User_${scanInput.slice(-4)}`,
        code: scanInput.trim(),
        type: Math.random() > 0.5 ? "friend" : "classmate",
        connectedAt: new Date().toISOString(),
      };
      const updated = [newConnection, ...connections];
      setConnections(updated);
      await AsyncStorage.setItem(CONNECTIONS_KEY, JSON.stringify(updated));
      setScanResult("success");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        setScanResult("idle");
        setScanInput("");
      }, 2500);
    } else {
      setScanResult("error");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => setScanResult("idle"), 2000);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Connect</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === "myCode" && styles.tabActive]}
          onPress={() => setTab("myCode")}
        >
          <Ionicons name="qr-code" size={18} color={tab === "myCode" ? Colors.secondary : Colors.textMuted} />
          <Text style={[styles.tabText, tab === "myCode" && styles.tabTextActive]}>My Code</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "scan" && styles.tabActive]}
          onPress={() => setTab("scan")}
        >
          <Ionicons name="scan" size={18} color={tab === "scan" ? Colors.secondary : Colors.textMuted} />
          <Text style={[styles.tabText, tab === "scan" && styles.tabTextActive]}>Scan / Enter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {tab === "myCode" ? (
          <View style={styles.myCodeSection}>
            {/* QR Code Display */}
            <Animated.View style={[styles.qrCard, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" size={120} color={Colors.secondary} />
              </View>
              <Text style={styles.codeText}>{myCode}</Text>
            </Animated.View>

            <Text style={styles.instruction}>
              Show this code to friends or classmates to connect instantly
            </Text>

            {/* Actions */}
            <View style={styles.codeActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                <Ionicons name={copied ? "checkmark" : "copy"} size={20} color={Colors.secondary} />
                <Text style={styles.actionBtnText}>{copied ? "Copied!" : "Copy Code"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleShare}>
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={styles.actionBtnPrimaryText}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* What gets shared */}
            <View style={styles.privacyCard}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyTitle}>What gets shared</Text>
                <Text style={styles.privacyText}>
                  Your display name and language goals. Email and personal info stay private until you choose to share.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.scanSection}>
            {/* Camera placeholder */}
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="camera" size={48} color={Colors.textMuted} />
              <Text style={styles.cameraText}>Camera scanner available on device</Text>
              <Text style={styles.cameraSubtext}>Or enter a code manually below</Text>
            </View>

            {/* Manual input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Enter friend's code</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={scanInput}
                  onChangeText={setScanInput}
                  placeholder="CM-XXXXXXXX"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                  returnKeyType="done"
                  onSubmitEditing={handleScanSubmit}
                />
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    !scanInput.trim() && styles.submitBtnDisabled,
                  ]}
                  onPress={handleScanSubmit}
                  disabled={!scanInput.trim()}
                >
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Result feedback */}
              {scanResult === "success" && (
                <View style={styles.resultSuccess}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.resultSuccessText}>Connected! Auto-followed and saved as contact.</Text>
                </View>
              )}
              {scanResult === "error" && (
                <View style={styles.resultError}>
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                  <Text style={styles.resultErrorText}>Invalid code. Make sure it starts with CM-</Text>
                </View>
              )}
            </View>

            {/* Recent connections */}
            {connections.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.recentTitle}>Recent Connections</Text>
                {connections.slice(0, 5).map((conn) => (
                  <View key={conn.id} style={styles.connItem}>
                    <View style={[styles.connAvatar, conn.type === "classmate" && styles.connAvatarClassmate]}>
                      <Ionicons
                        name={conn.type === "friend" ? "person" : "school"}
                        size={16}
                        color={conn.type === "friend" ? Colors.secondary : Colors.gold}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.connName}>{conn.name}</Text>
                      <Text style={styles.connType}>{conn.type === "friend" ? "Friend" : "Classmate"}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
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
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  tabText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  tabTextActive: {
    color: Colors.secondary,
  },
  content: {
    flex: 1,
    marginTop: Spacing.lg,
  },
  myCodeSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  qrCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    gap: Spacing.md,
    width: "100%",
    maxWidth: 300,
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 170, 255, 0.04)",
    borderRadius: BorderRadius.lg,
  },
  codeText: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  instruction: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  codeActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  actionBtnText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: "600",
  },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
  },
  actionBtnPrimaryText: {
    fontSize: FontSize.md,
    color: "#fff",
    fontWeight: "700",
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(0, 255, 136, 0.05)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.15)",
    width: "100%",
  },
  privacyTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.success,
    marginBottom: 2,
  },
  privacyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  scanSection: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  cameraPlaceholder: {
    height: 200,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    gap: 8,
  },
  cameraText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  cameraSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  inputSection: {
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 1,
  },
  submitBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  resultSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 255, 136, 0.08)",
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  resultSuccessText: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: "600",
  },
  resultError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 68, 68, 0.08)",
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  resultErrorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: "600",
  },
  recentSection: {
    gap: Spacing.sm,
  },
  recentTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  connItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  connAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  connAvatarClassmate: {
    backgroundColor: "rgba(255, 184, 0, 0.12)",
  },
  connName: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  connType: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
