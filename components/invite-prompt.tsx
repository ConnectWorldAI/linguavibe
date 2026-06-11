/**
 * InvitePrompt Component
 * 
 * Shows when a user tries to call/message someone who isn't on ConnectWorld AI.
 * Prompts them to send an invite link with rich preview (logo, app name, description).
 */

import { useState } from "react";
import { View, Text, Modal, Pressable, Share, Platform, StyleSheet, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { BrandName, BrandNameInline } from "@/components/brand-name";

interface InvitePromptProps {
  visible: boolean;
  onClose: () => void;
  recipientName?: string;
  type?: "call" | "message" | "video";
}

export function InvitePrompt({ visible, onClose, recipientName, type = "call" }: InvitePromptProps) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Generate invite link (in production this would call the server)
  const inviteCode = Math.random().toString(36).substring(2, 10);
  const inviteUrl = `https://connectworld.ai/invite/${inviteCode}`;
  const shareMessage = `Hey${recipientName ? ` ${recipientName}` : ""}! Join me on ConnectWorld AI — we can do free WiFi calling, messaging, and real-time translation together. Download here: ${inviteUrl}`;

  const typeLabel = type === "call" ? "call" : type === "video" ? "video call" : "message";

  const handleShare = async () => {
    setSharing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Share.share({
        message: shareMessage,
        title: "Join ConnectWorld AI",
      });
    } catch {}
    setSharing(false);
  };

  const handleCopy = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await Clipboard.setStringAsync(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}>
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={colors.muted} />
            </Pressable>
          </View>

          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + "20" }]}>
            <Text style={styles.iconEmoji}>📲</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            Invite to <BrandNameInline color={colors.foreground} aiColor={colors.foreground} />
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.muted }]}>
            {recipientName
              ? `${recipientName} isn't on ConnectWorld AI yet. Send them an invite so you can ${typeLabel} for free!`
              : `This person isn't on ConnectWorld AI yet. Send them an invite so you can ${typeLabel} for free!`}
          </Text>

          {/* Info box */}
          <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>
              Free WiFi Calling & Messaging
            </Text>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              Both users need a ConnectWorld AI account to use free calling, video calls, and messaging with real-time translation.
            </Text>
          </View>

          {/* Link preview mockup */}
          <View style={[styles.linkPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.linkPreviewContent}>
              <BrandName size="sm" color={colors.foreground} aiColor={colors.foreground} />
              <Text style={[styles.linkPreviewDesc, { color: colors.muted }]} numberOfLines={2}>
                Learn languages together with free calling & real-time translation
              </Text>
              <Text style={[styles.linkPreviewUrl, { color: colors.primary }]}>connectworld.ai</Text>
            </View>
            <View style={[styles.linkPreviewLogo, { backgroundColor: colors.primary + "20" }]}>
              <Text style={{ fontSize: 24 }}>🌐</Text>
            </View>
          </View>

          {/* Actions */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.shareBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
          >
            {sharing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.shareBtnText}>Share Invite Link</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleCopy}
            style={({ pressed }) => [
              styles.copyBtn,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.copyBtnText, { color: colors.foreground }]}>
              {copied ? "Copied!" : "Copy Link"}
            </Text>
          </Pressable>

          {/* Referral bonus note */}
          <Text style={[styles.bonusNote, { color: colors.success }]}>
            🎁 You'll earn 10 bonus credits when they sign up!
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  closeBtn: {
    padding: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  infoBox: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  linkPreview: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  linkPreviewContent: {
    flex: 1,
  },
  linkPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  linkPreviewDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  linkPreviewUrl: {
    fontSize: 11,
  },
  linkPreviewLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  shareBtn: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  copyBtn: {
    width: "100%",
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  copyBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  bonusNote: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
