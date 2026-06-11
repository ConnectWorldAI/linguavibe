import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const { width } = Dimensions.get("window");

const RECEIVED_MESSAGES = [
  { id: "1", from: "Sophia Martinez", avatar: "👩🏽", flag: "🇩🇴", duration: "0:32", time: "2 min ago", watched: false, translated: true },
  { id: "2", from: "Carlos Restrepo", avatar: "👨🏽", flag: "🇨🇴", duration: "1:05", time: "1 hr ago", watched: true, translated: true },
  { id: "3", from: "Marie Dubois", avatar: "👩🏻", flag: "🇫🇷", duration: "0:48", time: "Yesterday", watched: true, translated: false },
];

const SENT_MESSAGES = [
  { id: "s1", to: "Sophia Martinez", duration: "0:22", time: "5 min ago", status: "delivered" },
  { id: "s2", to: "Carlos Restrepo", duration: "0:45", time: "2 hrs ago", status: "watched" },
];

export default function VideoMessageScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Video Messages</Text>
          <Text style={styles.headerSub}>WiFi • No phone number needed</Text>
        </View>
        <TouchableOpacity style={styles.recordNewBtn} onPress={() => setIsRecording(true)}>
          <Ionicons name="videocam" size={18} color={Colors.textPrimary} />
          <Text style={styles.recordNewText}>Record</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Badge */}
      <View style={styles.connectionBadge}>
        <Ionicons name="wifi" size={14} color={Colors.success} />
        <Text style={styles.connectionText}>Connected via WiFi • Email: jordan@email.com</Text>
        <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabToggle}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "inbox" && styles.tabBtnActive]}
          onPress={() => setActiveTab("inbox")}
        >
          <Text style={[styles.tabBtnText, activeTab === "inbox" && styles.tabBtnTextActive]}>
            Inbox ({RECEIVED_MESSAGES.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "sent" && styles.tabBtnActive]}
          onPress={() => setActiveTab("sent")}
        >
          <Text style={[styles.tabBtnText, activeTab === "sent" && styles.tabBtnTextActive]}>
            Sent ({SENT_MESSAGES.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Inbox */}
        {activeTab === "inbox" && (
          <View style={styles.messageList}>
            {RECEIVED_MESSAGES.map((msg) => (
              <TouchableOpacity key={msg.id} style={[styles.messageCard, !msg.watched && styles.messageCardUnread]}>
                <View style={styles.messageAvatar}>
                  <Text style={{ fontSize: 28 }}>{msg.avatar}</Text>
                  {!msg.watched && <View style={styles.unreadDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.messageTop}>
                    <Text style={styles.messageName}>{msg.from}</Text>
                    <Text style={styles.messageTime}>{msg.time}</Text>
                  </View>
                  <View style={styles.messageBottom}>
                    <Text style={styles.messageFlag}>{msg.flag}</Text>
                    <Ionicons name="videocam" size={12} color={Colors.textSecondary} />
                    <Text style={styles.messageDuration}>{msg.duration}</Text>
                    {msg.translated && (
                      <View style={styles.translatedBadge}>
                        <Ionicons name="language" size={10} color={Colors.secondary} />
                        <Text style={styles.translatedText}>Translated</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity style={styles.playBtn}>
                  <Ionicons name="play" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Sent */}
        {activeTab === "sent" && (
          <View style={styles.messageList}>
            {SENT_MESSAGES.map((msg) => (
              <View key={msg.id} style={styles.messageCard}>
                <View style={styles.sentIcon}>
                  <Ionicons name="arrow-up-circle" size={28} color={Colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.messageTop}>
                    <Text style={styles.messageName}>To: {msg.to}</Text>
                    <Text style={styles.messageTime}>{msg.time}</Text>
                  </View>
                  <View style={styles.messageBottom}>
                    <Ionicons name="videocam" size={12} color={Colors.textSecondary} />
                    <Text style={styles.messageDuration}>{msg.duration}</Text>
                    <View style={[styles.statusBadge, msg.status === "watched" && styles.statusWatched]}>
                      <Ionicons
                        name={msg.status === "watched" ? "checkmark-done" : "checkmark"}
                        size={10}
                        color={msg.status === "watched" ? Colors.success : Colors.textSecondary}
                      />
                      <Text style={[styles.statusText, msg.status === "watched" && { color: Colors.success }]}>
                        {msg.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Send To */}
        <View style={styles.quickSend}>
          <Text style={styles.quickSendTitle}>Quick Send To</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickSendRow}>
            {[
              { name: "Sophia", avatar: "👩🏽", flag: "🇩🇴" },
              { name: "Carlos", avatar: "👨🏽", flag: "🇨🇴" },
              { name: "Marie", avatar: "👩🏻", flag: "🇫🇷" },
              { name: "Wei", avatar: "👨🏻", flag: "🇨🇳" },
              { name: "Amara", avatar: "👩🏿", flag: "🇳🇬" },
            ].map((person, i) => (
              <TouchableOpacity key={i} style={styles.quickSendItem} onPress={() => setIsRecording(true)}>
                <View style={styles.quickSendAvatar}>
                  <Text style={{ fontSize: 22 }}>{person.avatar}</Text>
                </View>
                <Text style={styles.quickSendName}>{person.name}</Text>
                <Text style={styles.quickSendFlag}>{person.flag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Video Message Features</Text>
          {[
            { icon: "language", title: "Auto-Translation", desc: "Messages are translated in real-time", color: Colors.secondary },
            { icon: "wifi", title: "WiFi Only", desc: "No phone number or SIM card needed", color: Colors.success },
            { icon: "mail", title: "Email Connected", desc: "Linked to your email account", color: Colors.gold },
            { icon: "shield-checkmark", title: "Encrypted", desc: "End-to-end encryption on all messages", color: "#8B5CF6" },
            { icon: "time", title: "Watch Anytime", desc: "Messages stay until you delete them", color: Colors.textAccent },
          ].map((feature, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15`, borderColor: `${feature.color}40` }]}>
                <Ionicons name={feature.icon as any} size={18} color={feature.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Recording Overlay */}
      {isRecording && (
        <View style={styles.recordingOverlay}>
          <SafeAreaView style={styles.recordingContent}>
            <TouchableOpacity style={styles.closeRecording} onPress={() => setIsRecording(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.recordingPreview}>
              <View style={styles.recordingCircle}>
                <Text style={styles.recordingInitial}>J</Text>
              </View>
              <View style={styles.recordingPulse} />
            </View>

            <Text style={styles.recordingLabel}>Recording Video Message</Text>
            <Text style={styles.recordingTimer}>00:00</Text>

            <View style={styles.recordingControls}>
              <TouchableOpacity style={styles.recordingCancelBtn} onPress={() => setIsRecording(false)}>
                <Ionicons name="close" size={20} color={Colors.accent} />
                <Text style={styles.recordingCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.recordingStartBtn}>
                <View style={styles.recordDot} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.recordingSendBtn} onPress={() => setIsRecording(false)}>
                <Ionicons name="send" size={20} color={Colors.success} />
                <Text style={styles.recordingSendText}>Send</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.recordingHint}>Tap the red button to start • Max 3 minutes</Text>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },

  // Header
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  recordNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  recordNewText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },

  // Connection badge
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: Spacing.lg,
    paddingVertical: 8,
    backgroundColor: Colors.greenGlow,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    marginBottom: Spacing.md,
  },
  connectionText: { fontSize: 10, color: Colors.success, fontWeight: "500" },

  // Tabs
  tabToggle: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: BorderRadius.full },
  tabBtnActive: { backgroundColor: Colors.secondary },
  tabBtnText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary },
  tabBtnTextActive: { color: Colors.textPrimary },

  // Message list
  messageList: { paddingHorizontal: Spacing.lg },
  messageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  messageCardUnread: { borderColor: Colors.glowBorder },
  messageAvatar: { position: "relative" },
  unreadDot: { position: "absolute", top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.secondary, borderWidth: 2, borderColor: Colors.surfaceCard },
  sentIcon: {},
  messageTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  messageName: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  messageTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  messageBottom: { flexDirection: "row", alignItems: "center", gap: 6 },
  messageFlag: { fontSize: 12 },
  messageDuration: { fontSize: FontSize.xs, color: Colors.textSecondary },
  translatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  translatedText: { fontSize: 9, color: Colors.secondary, fontWeight: "600" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  statusWatched: {},
  statusText: { fontSize: 10, color: Colors.textSecondary, textTransform: "capitalize" },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Quick send
  quickSend: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  quickSendTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  quickSendRow: { gap: 12 },
  quickSendItem: { alignItems: "center", gap: 4 },
  quickSendAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.glowBorder,
  },
  quickSendName: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textPrimary },
  quickSendFlag: { fontSize: 12 },

  // Features
  features: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  featuresTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  featureIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  featureTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  featureDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  // Recording overlay
  recordingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6, 9, 18, 0.97)",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingContent: { flex: 1, alignItems: "center", justifyContent: "center", width: "100%" },
  closeRecording: { position: "absolute", top: 20, right: 20 },
  recordingPreview: { alignItems: "center", justifyContent: "center", marginBottom: Spacing.xl },
  recordingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  recordingInitial: { fontSize: 44, fontWeight: "800", color: Colors.secondary },
  recordingPulse: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: Colors.redBorder,
  },
  recordingLabel: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textPrimary, marginBottom: 4 },
  recordingTimer: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.accent, marginBottom: Spacing.xl },
  recordingControls: { flexDirection: "row", alignItems: "center", gap: 40 },
  recordingCancelBtn: { alignItems: "center", gap: 4 },
  recordingCancelText: { fontSize: FontSize.xs, color: Colors.accent },
  recordingStartBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 45, 45, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  recordDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.accent },
  recordingSendBtn: { alignItems: "center", gap: 4 },
  recordingSendText: { fontSize: FontSize.xs, color: Colors.success },
  recordingHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xl },
});
