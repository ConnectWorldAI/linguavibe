/**
 * Report AI Response — inline flag/report button for AI message bubbles.
 * 
 * Allows users to report problematic AI responses directly from chat.
 * Reports are stored locally and can be synced to the server for review.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

const REPORTS_STORAGE_KEY = "@linguavibe_ai_reports";

export type ReportReason =
  | "incorrect_translation"
  | "offensive_content"
  | "inappropriate_response"
  | "wrong_grammar"
  | "cultural_insensitivity"
  | "off_topic"
  | "other";

interface ReportData {
  id: string;
  messageContent: string;
  reason: ReportReason;
  timestamp: number;
  context?: string; // What the user asked
  additionalNotes?: string;
  status: "pending" | "approved" | "dismissed" | "retrain";
  details?: string;
  reviewedAt?: number;
  reviewNote?: string;
}

interface ReportAIResponseProps {
  /** The AI message content being reported */
  messageContent: string;
  /** The user's original message/question (for context) */
  userMessage?: string;
  /** Callback after report is submitted */
  onReported?: () => void;
  /** Size variant */
  size?: "small" | "normal";
}

const REPORT_REASONS: { value: ReportReason; label: string; icon: string }[] = [
  { value: "incorrect_translation", label: "Incorrect Translation", icon: "🔤" },
  { value: "wrong_grammar", label: "Wrong Grammar Explanation", icon: "📝" },
  { value: "offensive_content", label: "Offensive Content", icon: "⚠️" },
  { value: "inappropriate_response", label: "Inappropriate Response", icon: "🚫" },
  { value: "cultural_insensitivity", label: "Culturally Insensitive", icon: "🌍" },
  { value: "off_topic", label: "Off-Topic / Irrelevant", icon: "🎯" },
  { value: "other", label: "Other Issue", icon: "📋" },
];

export function ReportAIResponse({
  messageContent,
  userMessage,
  onReported,
  size = "normal",
}: ReportAIResponseProps) {
  const colors = useColors();
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleOpen = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedReason) return;

    const report: ReportData = {
      id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      messageContent: messageContent.slice(0, 500),
      reason: selectedReason,
      timestamp: Date.now(),
      context: userMessage?.slice(0, 200),
      status: "pending",
      details: userMessage?.slice(0, 200),
    };

    try {
      // Store locally
      const existing = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
      const reports: ReportData[] = existing ? JSON.parse(existing) : [];
      reports.push(report);
      // Keep max 100 reports locally
      if (reports.length > 100) reports.splice(0, reports.length - 100);
      await AsyncStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setSubmitted(true);
      setTimeout(() => {
        setShowModal(false);
        setSubmitted(false);
        setSelectedReason(null);
        onReported?.();
      }, 1500);
    } catch (error) {
      Alert.alert("Error", "Failed to submit report. Please try again.");
    }
  }, [selectedReason, messageContent, userMessage, onReported]);

  const iconSize = size === "small" ? 14 : 18;

  return (
    <>
      {/* Flag button — sits inline on the message bubble */}
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.flagButton,
          size === "small" && styles.flagButtonSmall,
          pressed && { opacity: 0.5 },
        ]}
        accessibilityLabel="Report this AI response"
        accessibilityRole="button"
      >
        <Text style={{ fontSize: iconSize, opacity: 0.5 }}>⚑</Text>
      </Pressable>

      {/* Report Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            {submitted ? (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={[styles.successText, { color: colors.foreground }]}>
                  Report Submitted
                </Text>
                <Text style={[styles.successSubtext, { color: colors.muted }]}>
                  Thank you for helping improve ConnectWorld AI
                </Text>
              </View>
            ) : (
              <>
                {/* Header */}
                <View style={styles.sheetHeader}>
                  <Pressable
                    onPress={() => setShowModal(false)}
                    style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                  >
                    <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
                  </Pressable>
                  <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                    Report Response
                  </Text>
                  <Pressable
                    onPress={handleSubmit}
                    disabled={!selectedReason}
                    style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                  >
                    <Text
                      style={[
                        styles.submitText,
                        { color: selectedReason ? colors.primary : colors.muted },
                      ]}
                    >
                      Submit
                    </Text>
                  </Pressable>
                </View>

                {/* Message preview */}
                <View style={[styles.messagePreview, { backgroundColor: colors.background }]}>
                  <Text style={[styles.previewLabel, { color: colors.muted }]}>
                    AI Response:
                  </Text>
                  <Text
                    style={[styles.previewText, { color: colors.foreground }]}
                    numberOfLines={3}
                  >
                    {messageContent}
                  </Text>
                </View>

                {/* Reason selection */}
                <Text style={[styles.sectionLabel, { color: colors.muted }]}>
                  What's wrong with this response?
                </Text>
                <ScrollView style={styles.reasonList}>
                  {REPORT_REASONS.map((reason) => (
                    <Pressable
                      key={reason.value}
                      onPress={() => {
                        setSelectedReason(reason.value);
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.reasonRow,
                        { borderColor: colors.border },
                        selectedReason === reason.value && {
                          backgroundColor: colors.primary + "15",
                          borderColor: colors.primary,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={styles.reasonIcon}>{reason.icon}</Text>
                      <Text style={[styles.reasonLabel, { color: colors.foreground }]}>
                        {reason.label}
                      </Text>
                      {selectedReason === reason.value && (
                        <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </ScrollView>

                {/* Info footer */}
                <Text style={[styles.footerText, { color: colors.muted }]}>
                  Reports help us improve AI accuracy and safety. Your feedback is reviewed by our team.
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

/**
 * Helper to get stored reports (for the AI Safety settings screen)
 */
export async function getStoredReports(): Promise<ReportData[]> {
  try {
    const data = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Helper to clear stored reports after sync
 */
export async function clearStoredReports(): Promise<void> {
  await AsyncStorage.removeItem(REPORTS_STORAGE_KEY);
}

const styles = StyleSheet.create({
  flagButton: {
    padding: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  flagButtonSmall: {
    padding: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  cancelText: {
    fontSize: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
  },
  messagePreview: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
  },
  previewLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 20,
    marginBottom: 12,
  },
  reasonList: {
    maxHeight: 300,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  reasonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  reasonLabel: {
    fontSize: 15,
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: "600",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  successIcon: {
    fontSize: 48,
    color: "#22C55E",
    marginBottom: 12,
  },
  successText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  successSubtext: {
    fontSize: 14,
  },
});
