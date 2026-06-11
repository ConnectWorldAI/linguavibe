import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import {
  getDisappearingTimer,
  setDisappearingTimer,
  getTimerLabel,
  type DisappearingTimer,
} from "@/lib/chat-media-store";

const TIMER_OPTIONS: { value: DisappearingTimer; label: string; description: string; icon: string }[] = [
  { value: "off", label: "Off", description: "Messages will not disappear", icon: "infinite-outline" },
  { value: "24h", label: "24 hours", description: "Messages disappear after 24 hours", icon: "time-outline" },
  { value: "7d", label: "7 days", description: "Messages disappear after 7 days", icon: "calendar-outline" },
  { value: "90d", label: "90 days", description: "Messages disappear after 90 days", icon: "calendar-number-outline" },
];

export default function DisappearingMessagesScreen() {
  const params = useLocalSearchParams<{ contactId?: string; contactName?: string }>();
  const contactId = params.contactId || "unknown";
  const contactName = params.contactName || "Contact";

  const [selectedTimer, setSelectedTimer] = useState<DisappearingTimer>("off");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTimer();
  }, []);

  const loadTimer = async () => {
    const timer = await getDisappearingTimer(contactId);
    setSelectedTimer(timer);
  };

  const selectTimer = async (timer: DisappearingTimer) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTimer(timer);
    setSaving(true);
    await setDisappearingTimer(contactId, timer);
    setSaving(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disappearing Messages</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info section */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="timer-outline" size={32} color={Colors.secondary} />
          </View>
          <Text style={styles.infoTitle}>Auto-delete messages</Text>
          <Text style={styles.infoDesc}>
            When enabled, new messages sent in this chat with {contactName} will disappear after the selected time period. This applies to both sent and received messages.
          </Text>
        </View>

        {/* Timer options */}
        <View style={styles.optionsCard}>
          <Text style={styles.sectionLabel}>Message Timer</Text>
          {TIMER_OPTIONS.map((option) => {
            const isSelected = selectedTimer === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionRow, isSelected && styles.optionRowActive]}
                onPress={() => selectTimer(option.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, isSelected && styles.optionIconActive]}>
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={isSelected ? "#FFFFFF" : Colors.textMuted}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDesc}>{option.description}</Text>
                </View>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Warning */}
        {selectedTimer !== "off" && (
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={18} color={Colors.gold} />
            <Text style={styles.warningText}>
              Messages older than {getTimerLabel(selectedTimer)} will be automatically removed from this conversation. This action cannot be undone.
            </Text>
          </View>
        )}

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.privacyText}>
            Disappearing messages help protect your privacy. Both you and {contactName} will see a timer icon on messages that will disappear.
          </Text>
        </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 60,
  },
  infoCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  infoIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  infoTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  infoDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  optionsCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  optionRowActive: {
    backgroundColor: Colors.secondary + "08",
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderBottomColor: "transparent",
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconActive: {
    backgroundColor: Colors.secondary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  optionLabelActive: {
    color: Colors.secondary,
  },
  optionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: Colors.secondary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.gold + "10",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    marginBottom: Spacing.lg,
  },
  warningText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.gold,
    lineHeight: 20,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: Spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
