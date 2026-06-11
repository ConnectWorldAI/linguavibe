import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Share,
  Platform,
  FlatList,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const STORAGE_KEY_CODE = "@connectworld_share_code";
const STORAGE_KEY_CONTACTS = "@connectworld_shared_contacts";

type SharedContact = {
  id: string;
  name: string;
  avatar: string;
  flag: string;
  code: string;
  email: string;
  language: string;
  connectedAt: string;
  autoFollowed: boolean;
};

type ShareSettings = {
  shareEmail: boolean;
  shareLanguages: boolean;
  shareLevel: boolean;
  shareLocation: boolean;
  sharePhoto: boolean;
};

const MOCK_CONTACTS: SharedContact[] = [
  { id: "1", name: "Maria Garcia", avatar: "👩🏽", flag: "🇲🇽", code: "CM-MG29481", email: "maria.g@email.com", language: "Spanish", connectedAt: "2 hours ago", autoFollowed: true },
  { id: "2", name: "Yuki Tanaka", avatar: "👩🏻", flag: "🇯🇵", code: "CM-YT83721", email: "yuki.t@email.com", language: "Japanese", connectedAt: "Yesterday", autoFollowed: true },
  { id: "3", name: "Pierre Dupont", avatar: "👨🏻", flag: "🇫🇷", code: "CM-PD56192", email: "pierre.d@email.com", language: "French", connectedAt: "3 days ago", autoFollowed: true },
];

export default function ContactSharingScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"my_code" | "scan" | "contacts">("my_code");
  const [myCode, setMyCode] = useState("CM-XXXXXXXX");
  const [scanInput, setScanInput] = useState("");
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [scannedUser, setScannedUser] = useState<SharedContact | null>(null);
  const [recentContacts, setRecentContacts] = useState<SharedContact[]>(MOCK_CONTACTS);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    shareEmail: true,
    shareLanguages: true,
    shareLevel: true,
    shareLocation: false,
    sharePhoto: true,
  });
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMyCode();
  }, []);

  const loadMyCode = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_CODE);
      if (stored) {
        setMyCode(stored);
      } else {
        const generated = `CM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        setMyCode(generated);
        await AsyncStorage.setItem(STORAGE_KEY_CODE, generated);
      }
    } catch {}
  };

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleScan = () => {
    if (!scanInput.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanStatus("scanning");
    startScanAnimation();

    // Simulate scan processing
    setTimeout(() => {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      if (scanInput.startsWith("CM-") && scanInput.length >= 8) {
        setScanStatus("success");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newContact: SharedContact = {
          id: Date.now().toString(),
          name: "New Connection",
          avatar: "👤",
          flag: "🌍",
          code: scanInput.trim(),
          email: `user_${scanInput.slice(3, 7).toLowerCase()}@connectworld.ai`,
          language: "Unknown",
          connectedAt: "Just now",
          autoFollowed: true,
        };
        setScannedUser(newContact);
        setRecentContacts((prev) => [newContact, ...prev]);
        Animated.spring(successAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
      } else {
        setScanStatus("error");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }, 1500);
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Connect with me on ConnectWorld AI! My code: ${myCode}\n\nDownload the app and scan my code to start practicing languages together.`,
        title: "Share ConnectWorld AI Code",
      });
    } catch {}
  };

  const resetScan = () => {
    setScanInput("");
    setScanStatus("idle");
    setScannedUser(null);
    successAnim.setValue(0);
  };

  const renderMyCodeTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* QR Code Display */}
      <View style={[styles.qrCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.qrLabel, { color: colors.muted }]}>Your ConnectWorld Code</Text>
        <View style={[styles.qrPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* QR Code visual representation */}
          <View style={styles.qrGrid}>
            {Array.from({ length: 64 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.qrCell,
                  { backgroundColor: Math.random() > 0.4 ? colors.foreground : "transparent" },
                ]}
              />
            ))}
          </View>
          <View style={[styles.qrCenter, { backgroundColor: colors.primary }]}>
            <Text style={{ fontSize: 16, color: "#FFF", fontWeight: "800" }}>CM</Text>
          </View>
        </View>
        <Text style={[styles.codeText, { color: colors.foreground }]}>{myCode}</Text>
        <Text style={[styles.codeHint, { color: colors.muted }]}>Others scan this to connect with you</Text>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name="copy-outline" size={18} color={colors.foreground} />
            <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Privacy Controls */}
      <View style={[styles.privacyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.privacySectionTitle, { color: colors.foreground }]}>What You Share</Text>
        <Text style={[styles.privacyDesc, { color: colors.muted }]}>Control what info is shared when someone scans your code</Text>

        {[
          { key: "sharePhoto", label: "Profile Photo", icon: "camera-outline" },
          { key: "shareEmail", label: "Email Address", icon: "mail-outline" },
          { key: "shareLanguages", label: "Languages", icon: "language-outline" },
          { key: "shareLevel", label: "Proficiency Level", icon: "bar-chart-outline" },
          { key: "shareLocation", label: "Location", icon: "location-outline" },
        ].map((item) => (
          <View key={item.key} style={[styles.privacyRow, { borderBottomColor: colors.border }]}>
            <View style={styles.privacyRowLeft}>
              <Ionicons name={item.icon as any} size={18} color={colors.primary} />
              <Text style={[styles.privacyRowLabel, { color: colors.foreground }]}>{item.label}</Text>
            </View>
            <Switch
              value={shareSettings[item.key as keyof ShareSettings]}
              onValueChange={(val) => setShareSettings((prev) => ({ ...prev, [item.key]: val }))}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={shareSettings[item.key as keyof ShareSettings] ? colors.primary : colors.muted}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderScanTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {scanStatus === "success" && scannedUser ? (
        <Animated.View style={[styles.successCard, { backgroundColor: colors.surface, borderColor: "#4ADE8040", transform: [{ scale: successAnim }] }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#4ADE80" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Connected!</Text>
          <Text style={[styles.successDesc, { color: colors.muted }]}>
            You've been auto-followed and their contact has been saved.
          </Text>
          <View style={[styles.scannedUserCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={styles.scannedAvatar}>{scannedUser.avatar}</Text>
            <View style={styles.scannedInfo}>
              <Text style={[styles.scannedName, { color: colors.foreground }]}>{scannedUser.name}</Text>
              <Text style={[styles.scannedEmail, { color: colors.muted }]}>{scannedUser.email}</Text>
            </View>
            <View style={[styles.followedBadge, { backgroundColor: "#4ADE8015" }]}>
              <Ionicons name="checkmark" size={12} color="#4ADE80" />
              <Text style={[styles.followedText, { color: "#4ADE80" }]}>Following</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.scanAgainBtn, { backgroundColor: colors.primary }]} onPress={resetScan}>
            <Text style={styles.scanAgainText}>Scan Another</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <>
          {/* Camera Placeholder */}
          <View style={[styles.cameraBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cameraOverlay}>
              <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
              <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBR, { borderColor: colors.primary }]} />
              {scanStatus === "scanning" ? (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name="scan-outline" size={48} color={colors.primary} />
                </Animated.View>
              ) : (
                <Ionicons name="qr-code-outline" size={48} color={colors.muted} />
              )}
            </View>
            <Text style={[styles.cameraHint, { color: colors.muted }]}>
              {scanStatus === "scanning" ? "Scanning..." : "Point camera at a ConnectWorld QR code"}
            </Text>
          </View>

          {/* Manual Entry */}
          <View style={[styles.manualEntry, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.manualTitle, { color: colors.foreground }]}>Or enter code manually</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.codeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="CM-XXXXXXXX"
                placeholderTextColor={colors.muted}
                value={scanInput}
                onChangeText={setScanInput}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleScan}
              />
              <TouchableOpacity
                style={[styles.connectBtn, { backgroundColor: colors.primary, opacity: scanInput.trim() ? 1 : 0.5 }]}
                onPress={handleScan}
                disabled={!scanInput.trim()}
              >
                <Text style={styles.connectBtnText}>Connect</Text>
              </TouchableOpacity>
            </View>
            {scanStatus === "error" && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color="#F87171" />
                <Text style={[styles.errorText, { color: "#F87171" }]}>Invalid code. Please check and try again.</Text>
              </View>
            )}
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              When you scan someone's code, you'll automatically follow them, save their email, and add them as a contact.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderContactsTab = () => (
    <FlatList
      data={recentContacts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.tabContent}
      ListHeaderComponent={
        <Text style={[styles.contactsHeader, { color: colors.muted }]}>
          {recentContacts.length} contacts shared via QR
        </Text>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.contactRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: "/connection-profile" as any, params: { name: item.name } })}
        >
          <View style={styles.contactAvatar}>
            <Text style={{ fontSize: 24 }}>{item.avatar}</Text>
            <Text style={styles.contactFlag}>{item.flag}</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: colors.foreground }]}>{item.name}</Text>
            <Text style={[styles.contactEmail, { color: colors.muted }]}>{item.email}</Text>
            <Text style={[styles.contactTime, { color: colors.muted }]}>Connected {item.connectedAt}</Text>
          </View>
          <View style={styles.contactActions}>
            {item.autoFollowed && (
              <View style={[styles.autoFollowBadge, { backgroundColor: "#4ADE8015" }]}>
                <Ionicons name="checkmark-circle" size={12} color="#4ADE80" />
                <Text style={[styles.autoFollowText, { color: "#4ADE80" }]}>Following</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="qr-code-outline" size={48} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No shared contacts yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.muted }]}>Scan someone's QR code to connect</Text>
        </View>
      }
    />
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Contact Sharing</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {([
          { id: "my_code", label: "My Code", icon: "qr-code-outline" },
          { id: "scan", label: "Scan", icon: "scan-outline" },
          { id: "contacts", label: "Contacts", icon: "people-outline" },
        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && { backgroundColor: colors.primary + "15" }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.id);
            }}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.id ? colors.primary : colors.muted} />
            <Text style={[styles.tabLabel, { color: activeTab === tab.id ? colors.primary : colors.muted }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === "my_code" && renderMyCodeTab()}
      {activeTab === "scan" && renderScanTab()}
      {activeTab === "contacts" && renderContactsTab()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  tabBar: { flexDirection: "row", marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, padding: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 8 },
  tabLabel: { fontSize: 12, fontWeight: "700" },
  tabContent: { padding: 16 },
  // My Code Tab
  qrCard: { alignItems: "center", padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  qrLabel: { fontSize: 12, fontWeight: "600", marginBottom: 16 },
  qrPlaceholder: { width: 180, height: 180, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: "hidden" },
  qrGrid: { flexDirection: "row", flexWrap: "wrap", width: 160, height: 160, padding: 8 },
  qrCell: { width: 10, height: 10, margin: 1, borderRadius: 1 },
  qrCenter: { position: "absolute", width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  codeText: { fontSize: 22, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  codeHint: { fontSize: 12 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  // Privacy
  privacyCard: { padding: 16, borderRadius: 14, borderWidth: 1 },
  privacySectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  privacyDesc: { fontSize: 12, marginBottom: 12 },
  privacyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 0.5 },
  privacyRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  privacyRowLabel: { fontSize: 14, fontWeight: "600" },
  // Scan Tab
  cameraBox: { height: 240, borderRadius: 16, borderWidth: 1, marginBottom: 16, alignItems: "center", justifyContent: "center" },
  cameraOverlay: { width: 180, height: 180, alignItems: "center", justifyContent: "center" },
  cornerTL: { position: "absolute", top: 0, left: 0, width: 30, height: 30, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: 4 },
  cornerTR: { position: "absolute", top: 0, right: 0, width: 30, height: 30, borderTopWidth: 3, borderRightWidth: 3, borderRadius: 4 },
  cornerBL: { position: "absolute", bottom: 0, left: 0, width: 30, height: 30, borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: 4 },
  cornerBR: { position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: 4 },
  cameraHint: { fontSize: 12, marginTop: 8 },
  manualEntry: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  manualTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  inputRow: { flexDirection: "row", gap: 8 },
  codeInput: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontWeight: "600" },
  connectBtn: { paddingHorizontal: 18, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  connectBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  errorText: { fontSize: 12 },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  // Success
  successCard: { alignItems: "center", padding: 24, borderRadius: 16, borderWidth: 1 },
  successIcon: { marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  successDesc: { fontSize: 13, textAlign: "center", marginBottom: 16 },
  scannedUserCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, width: "100%", marginBottom: 16 },
  scannedAvatar: { fontSize: 28, marginRight: 12 },
  scannedInfo: { flex: 1 },
  scannedName: { fontSize: 15, fontWeight: "700" },
  scannedEmail: { fontSize: 12, marginTop: 2 },
  followedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  followedText: { fontSize: 11, fontWeight: "700" },
  scanAgainBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  scanAgainText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  // Contacts Tab
  contactsHeader: { fontSize: 12, marginBottom: 12 },
  contactRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  contactAvatar: { position: "relative", marginRight: 12 },
  contactFlag: { position: "absolute", bottom: -2, right: -4, fontSize: 10 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: "700" },
  contactEmail: { fontSize: 12, marginTop: 2 },
  contactTime: { fontSize: 11, marginTop: 2 },
  contactActions: {},
  autoFollowBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  autoFollowText: { fontSize: 10, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyDesc: { fontSize: 13 },
});
