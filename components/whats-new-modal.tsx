import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const WHATS_NEW_VERSION_KEY = "@connectworld_whats_new_version";
const CURRENT_VERSION = "1.4.0";

type ChangelogEntry = {
  icon: string;
  title: string;
  description: string;
  tag: "new" | "improved" | "fixed";
};

const CHANGELOG: ChangelogEntry[] = [
  {
    icon: "gift",
    title: "Streak Rewards",
    description: "Earn credits at 7, 30, and 100-day streak milestones. Keep learning daily!",
    tag: "new",
  },
  {
    icon: "card",
    title: "Gift Credits",
    description: "Send credits to friends directly from the Store. Choose from 5 tiers.",
    tag: "new",
  },
  {
    icon: "qr-code",
    title: "QR Code Sharing",
    description: "Share your profile via QR code. Scanning auto-follows and saves contact info.",
    tag: "new",
  },
  {
    icon: "call",
    title: "Call Transcript",
    description: "Transcribe calls with permission consent. Both parties must agree (like Teams).",
    tag: "new",
  },
  {
    icon: "videocam",
    title: "Video Call Upgrades",
    description: "Background blur/remove, emoji reactions, screen sharing, and call waiting.",
    tag: "improved",
  },
  {
    icon: "notifications",
    title: "Notifications Screen",
    description: "Tap the bell to see all notifications with full content. Mark as read.",
    tag: "improved",
  },
  {
    icon: "flash",
    title: "Quick Actions FAB",
    description: "Floating button on home screen for instant Call, Translate, or Record.",
    tag: "new",
  },
  {
    icon: "heart",
    title: "Favorites Persistence",
    description: "Removed items stay removed. Swipe to remove with undo toast and Recently Deleted.",
    tag: "fixed",
  },
];

const TAG_COLORS: Record<string, string> = {
  new: Colors.success,
  improved: Colors.secondary,
  fixed: Colors.gold,
};

export function WhatsNewModal() {
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const lastSeen = await AsyncStorage.getItem(WHATS_NEW_VERSION_KEY);
      if (lastSeen !== CURRENT_VERSION) {
        // Small delay so the app loads first
        setTimeout(() => {
          setVisible(true);
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]).start();
        }, 1500);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleDismiss = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(WHATS_NEW_VERSION_KEY, CURRENT_VERSION);
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setVisible(false);
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={24} color={Colors.gold} />
            </View>
            <Text style={styles.title}>What's New</Text>
            <Text style={styles.version}>v{CURRENT_VERSION}</Text>
          </View>

          {/* Changelog */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {CHANGELOG.map((item, idx) => (
              <View key={idx} style={styles.entry}>
                <View style={styles.entryIcon}>
                  <Ionicons name={item.icon as any} size={18} color={Colors.secondary} />
                </View>
                <View style={styles.entryContent}>
                  <View style={styles.entryTitleRow}>
                    <Text style={styles.entryTitle}>{item.title}</Text>
                    <View style={[styles.tag, { backgroundColor: TAG_COLORS[item.tag] + "20" }]}>
                      <Text style={[styles.tagText, { color: TAG_COLORS[item.tag] }]}>
                        {item.tag.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.entryDesc}>{item.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Dismiss Button */}
          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
            <Text style={styles.dismissText}>Got it!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "80%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 28,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gold + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  version: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  list: {
    maxHeight: 350,
  },
  entry: {
    flexDirection: "row",
    marginBottom: 14,
    alignItems: "flex-start",
  },
  entryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  entryContent: {
    flex: 1,
  },
  entryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  entryTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9,
    fontWeight: "800",
  },
  entryDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  dismissBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dismissText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#fff",
  },
});
