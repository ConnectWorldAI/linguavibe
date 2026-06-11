import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const DEVICES_KEY = "@connectworld_linked_devices";

type LinkedDevice = {
  id: string;
  name: string;
  platform: "windows" | "mac" | "web" | "tablet" | "other";
  lastActive: string;
  linkedAt: string;
};

export default function LinkedDevicesScreen() {
  const colors = useColors();
  const [devices, setDevices] = useState<LinkedDevice[]>([]);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const stored = await AsyncStorage.getItem(DEVICES_KEY);
      if (stored) setDevices(JSON.parse(stored));
    } catch {}
  };

  const handleLinkDevice = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Link a Device",
      "To link a device:\n\n1. Open ConnectWorld AI on your computer or tablet\n2. Go to Settings → Linked Devices\n3. Scan the QR code shown on this device\n\nYour learning progress and conversations will sync across all linked devices.",
      [{ text: "Got it" }]
    );
  };

  const handleUnlinkDevice = (device: LinkedDevice) => {
    Alert.alert(
      `Unlink ${device.name}?`,
      "This device will no longer have access to your ConnectWorld AI account. You can re-link it anytime.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            const updated = devices.filter((d) => d.id !== device.id);
            setDevices(updated);
            await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(updated));
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const getPlatformIcon = (platform: LinkedDevice["platform"]) => {
    switch (platform) {
      case "windows": return "desktop-outline";
      case "mac": return "laptop-outline";
      case "web": return "globe-outline";
      case "tablet": return "tablet-landscape-outline";
      default: return "hardware-chip-outline";
    }
  };

  const s = createStyles(colors);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Linked Devices</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Hero Illustration */}
        <View style={s.heroSection}>
          <View style={[s.heroIconContainer, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="phone-portrait" size={28} color={colors.primary} />
            <View style={s.heroConnector}>
              <Ionicons name="heart" size={14} color={colors.primary} />
            </View>
            <Ionicons name="laptop" size={32} color={colors.primary} />
          </View>
          <Text style={s.heroTitle}>Use ConnectWorld AI on other devices</Text>
          <Text style={s.heroSubtitle}>
            You can link other devices to this account, including Windows, Mac, and Web. Your learning progress syncs everywhere.
          </Text>
          <View style={s.encryptionBadge}>
            <Ionicons name="lock-closed" size={14} color={colors.primary} />
            <Text style={s.encryptionText}>
              Your data is <Text style={{ fontWeight: "700", color: colors.primary }}>end-to-end encrypted</Text>
            </Text>
          </View>
        </View>

        {/* Linked Devices List */}
        {devices.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Active Devices</Text>
            <View style={s.card}>
              {devices.map((device, idx) => (
                <View key={device.id}>
                  {idx > 0 && <View style={[s.sep, { backgroundColor: colors.border }]} />}
                  <TouchableOpacity
                    style={s.deviceRow}
                    onPress={() => handleUnlinkDevice(device)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.deviceIcon, { backgroundColor: colors.primary + "15" }]}>
                      <Ionicons name={getPlatformIcon(device.platform) as any} size={22} color={colors.primary} />
                    </View>
                    <View style={s.deviceInfo}>
                      <Text style={s.deviceName}>{device.name}</Text>
                      <Text style={s.deviceMeta}>Last active: {device.lastActive}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        {devices.length === 0 && (
          <View style={s.emptyState}>
            <Ionicons name="link-outline" size={32} color={colors.muted} />
            <Text style={s.emptyText}>No linked devices yet</Text>
            <Text style={s.emptySubtext}>Link a device to sync your learning across platforms</Text>
          </View>
        )}

        {/* Link Button */}
        <TouchableOpacity
          style={[s.linkButton, { backgroundColor: colors.primary }]}
          onPress={handleLinkDevice}
          activeOpacity={0.8}
        >
          <Text style={s.linkButtonText}>Link a device</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={s.footerBadge}>
          <Ionicons name="lock-closed" size={12} color={colors.muted} />
          <Text style={s.footerText}>
            Your data is <Text style={{ fontWeight: "600", color: colors.primary }}>end-to-end encrypted</Text> on all of your devices.
          </Text>
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
    heroSection: { alignItems: "center", paddingVertical: 32 },
    heroIconContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderRadius: 20,
      marginBottom: 20,
    },
    heroConnector: { marginHorizontal: 4 },
    heroTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
      marginBottom: 10,
    },
    heroSubtitle: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 20,
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    encryptionBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    encryptionText: { fontSize: 13, color: colors.muted },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 20,
      overflow: "hidden",
    },
    deviceRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    deviceIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    deviceInfo: { flex: 1 },
    deviceName: { fontSize: 15, fontWeight: "600", color: colors.foreground },
    deviceMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
    sep: { height: 0.5, marginLeft: 66 },
    emptyState: {
      alignItems: "center",
      paddingVertical: 24,
      gap: 6,
    },
    emptyText: { fontSize: 15, fontWeight: "600", color: colors.muted },
    emptySubtext: { fontSize: 13, color: colors.muted },
    linkButton: {
      paddingVertical: 16,
      borderRadius: 28,
      alignItems: "center",
      marginTop: 12,
      marginBottom: 16,
    },
    linkButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
    footerBadge: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 8,
    },
    footerText: { fontSize: 12, color: colors.muted },
  });
}
