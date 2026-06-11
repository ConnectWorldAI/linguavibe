import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { usePip } from "@/lib/pip-context";
import { useUsage } from "@/lib/usage-context";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function VideoCallScreen() {
  const { minimizeCall } = usePip();
  const { incrementUsage } = useUsage();
  const params = useLocalSearchParams<{
    callId?: string;
    roomName?: string;
    token?: string;
    calleeName?: string;
    calleeId?: string;
    type?: "video" | "voice";
    direction?: "outgoing" | "incoming";
  }>();

  // Twilio integration - get token and connect to room
  const endCallMutation = trpc.videoCall.endCall.useMutation();
  const twilioRoomRef = useRef<string | null>(params.roomName || null);
  const twilioTokenRef = useRef<string | null>(params.token || null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [audioRoute, setAudioRoute] = useState<"phone" | "speaker" | "bluetooth">("phone");
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isTranslating, setIsTranslating] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  // Screen sharing
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  // Background effects
  const [bgEffect, setBgEffect] = useState<"none" | "blur" | "remove">("none");
  const [showBgMenu, setShowBgMenu] = useState(false);
  // Emoji reactions
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  // Transcript permission
  const [transcriptPermission, setTranscriptPermission] = useState<"none" | "requested" | "granted">("none");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Screen sharing
  const handleScreenShare = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsScreenSharing(!isScreenSharing);
  };

  // Background effects
  const handleBgEffect = (effect: "none" | "blur" | "remove") => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBgEffect(effect);
    setShowBgMenu(false);
  };

  // Emoji reactions
  const REACTIONS = ["\ud83d\udc4d", "\u2764\ufe0f", "\ud83d\ude02", "\ud83d\ude2e", "\ud83c\udf89", "\ud83d\udd25"];
  const handleReaction = (emoji: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveReaction(emoji);
    setShowEmojiPicker(false);
    setTimeout(() => setActiveReaction(null), 2500);
  };

  // Transcript permission
  const handleRequestTranscript = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPermissionModal(true);
  };
  const handleSendPermissionRequest = () => {
    setTranscriptPermission("requested");
    setShowPermissionModal(false);
    setTimeout(() => {
      setTranscriptPermission("granted");
      setShowTranscript(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3000);
  };

  // Call waiting
  const [incomingCall, setIncomingCall] = useState(false);
  const [onHold, setOnHold] = useState(false);
  // Simulate incoming call after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => setIncomingCall(true), 15000);
    return () => clearTimeout(timer);
  }, []);
  const handleAnswerWaiting = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOnHold(true);
    setIncomingCall(false);
  };
  const handleDeclineWaiting = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIncomingCall(false);
  };
  const handleMergeCalls = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setOnHold(false);
    setIncomingCall(false);
  };
  const handleSwapCalls = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOnHold(!onHold);
  };

  return (
    <View style={styles.container}>
      {/* Remote Video (Teacher) */}
      <View style={styles.remoteVideo}>
        <View style={styles.remoteVideoPlaceholder}>
          <Text style={styles.remoteAvatar}>👩🏽</Text>
          <Text style={styles.remoteName}>Sophia Martinez</Text>
          <Text style={styles.remoteDialect}>🇩🇴 Dominican Spanish</Text>
        </View>

        {/* Translation Overlay */}
        {isTranslating && (
          <View style={styles.translationOverlay}>
            <View style={styles.translationBubble}>
              <View style={styles.translationHeader}>
                <Ionicons name="language" size={12} color={Colors.secondary} />
                <Text style={styles.translationLabel}>LIVE TRANSLATION</Text>
              </View>
              <Text style={styles.translationText}>
                "Dime, ¿cómo tú ta'?"
              </Text>
              <Text style={styles.translationEnglish}>
                "Tell me, how are you doing?"
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Self Video (small) */}
      <View style={styles.selfVideo}>
        {isCameraOff ? (
          <View style={styles.cameraOff}>
            <Ionicons name="videocam-off" size={20} color={Colors.textMuted} />
          </View>
        ) : (
          <View style={styles.selfVideoPlaceholder}>
            {bgEffect !== "none" && (
              <View style={styles.bgEffectIndicator}>
                <Ionicons name={bgEffect === "blur" ? "eye-off" : "cut"} size={10} color={Colors.secondary} />
              </View>
            )}
            <Text style={styles.selfInitial}>J</Text>
          </View>
        )}
      </View>

      {/* Floating Emoji Reaction */}
      {activeReaction && (
        <View style={styles.floatingReaction}>
          <Text style={styles.floatingReactionEmoji}>{activeReaction}</Text>
        </View>
      )}

      {/* Screen Sharing Banner */}
      {isScreenSharing && (
        <View style={styles.screenShareBanner}>
          <Ionicons name="desktop" size={14} color={Colors.textPrimary} />
          <Text style={styles.screenShareText}>Sharing your screen</Text>
          <TouchableOpacity onPress={handleScreenShare}>
            <Text style={styles.screenShareStop}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* On Hold Banner */}
      {onHold && (
        <View style={styles.onHoldBanner}>
          <Ionicons name="pause-circle" size={14} color={Colors.gold} />
          <Text style={styles.onHoldText}>Sophia on hold</Text>
          <TouchableOpacity onPress={handleSwapCalls}>
            <Text style={styles.onHoldSwap}>Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleMergeCalls}>
            <Text style={styles.onHoldMerge}>Merge</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Incoming Call Waiting Overlay */}
      {incomingCall && (
        <View style={styles.callWaitingOverlay}>
          <View style={styles.callWaitingCard}>
            <View style={styles.callWaitingAvatar}>
              <Text style={styles.callWaitingAvatarText}>\ud83d\udc68\ud83c\udffe</Text>
            </View>
            <Text style={styles.callWaitingName}>Carlos Rivera</Text>
            <Text style={styles.callWaitingSub}>Incoming call...</Text>
            <View style={styles.callWaitingActions}>
              <TouchableOpacity style={styles.callWaitingDecline} onPress={handleDeclineWaiting}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
                <Text style={styles.callWaitingActionText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callWaitingAnswer} onPress={handleAnswerWaiting}>
                <Ionicons name="call" size={20} color={Colors.textPrimary} />
                <Text style={styles.callWaitingActionText}>Hold & Answer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.topBarContent}>
          <View style={styles.callInfo}>
            <View style={styles.liveDot} />
            <Text style={styles.callTimer}>{formatTime(callDuration)}</Text>
            <View style={styles.wifiBadge}>
              <Ionicons name="wifi" size={12} color={Colors.success} />
              <Text style={styles.wifiText}>WiFi</Text>
            </View>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.minimizeBtn}
              onPress={() => {
                minimizeCall("video", "Sophia Martinez", "👩🏽");
                router.back();
              }}
            >
              <Ionicons name="chevron-down" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.translateToggle, isTranslating && styles.translateToggleActive]}
              onPress={() => setIsTranslating(!isTranslating)}
            >
              <Ionicons name="language" size={16} color={isTranslating ? Colors.textPrimary : Colors.textSecondary} />
              <Text style={[styles.translateToggleText, isTranslating && { color: Colors.textPrimary }]}>
                {isTranslating ? "ON" : "OFF"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Connection info */}
        <View style={styles.connectionInfo}>
          <Ionicons name="shield-checkmark" size={12} color={Colors.success} />
          <Text style={styles.connectionText}>End-to-end encrypted • No phone number required</Text>
        </View>

        {/* Emoji Picker Row */}
        {showEmojiPicker && (
          <View style={styles.emojiPickerRow}>
            {REACTIONS.map((emoji) => (
              <TouchableOpacity key={emoji} style={styles.emojiBtn} onPress={() => handleReaction(emoji)}>
                <Text style={styles.emojiBtnText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Background Effect Menu */}
        {showBgMenu && (
          <View style={styles.bgMenu}>
            <TouchableOpacity
              style={[styles.bgOption, bgEffect === "none" && styles.bgOptionActive]}
              onPress={() => handleBgEffect("none")}
            >
              <Ionicons name="image" size={18} color={bgEffect === "none" ? Colors.secondary : Colors.textSecondary} />
              <Text style={[styles.bgOptionText, bgEffect === "none" && styles.bgOptionTextActive]}>None</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bgOption, bgEffect === "blur" && styles.bgOptionActive]}
              onPress={() => handleBgEffect("blur")}
            >
              <Ionicons name="eye-off" size={18} color={bgEffect === "blur" ? Colors.secondary : Colors.textSecondary} />
              <Text style={[styles.bgOptionText, bgEffect === "blur" && styles.bgOptionTextActive]}>Blur</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bgOption, bgEffect === "remove" && styles.bgOptionActive]}
              onPress={() => handleBgEffect("remove")}
            >
              <Ionicons name="cut" size={18} color={bgEffect === "remove" ? Colors.secondary : Colors.textSecondary} />
              <Text style={[styles.bgOptionText, bgEffect === "remove" && styles.bgOptionTextActive]}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Control buttons */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={22} color={isMuted ? Colors.accent : Colors.textPrimary} />
            <Text style={styles.controlLabel}>{isMuted ? "Unmute" : "Mute"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, audioRoute !== "phone" && styles.controlBtnActive]}
            onPress={() => {
              setShowAudioPicker(true);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name={audioRoute === "bluetooth" ? "bluetooth" : audioRoute === "speaker" ? "volume-high" : "volume-medium"} size={22} color={audioRoute !== "phone" ? Colors.accent : Colors.textPrimary} />
            <Text style={styles.controlLabel}>{audioRoute === "bluetooth" ? "BT" : audioRoute === "speaker" ? "Speaker" : "Audio"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
            onPress={() => setIsCameraOff(!isCameraOff)}
          >
            <Ionicons name={isCameraOff ? "videocam-off" : "videocam"} size={22} color={isCameraOff ? Colors.accent : Colors.textPrimary} />
            <Text style={styles.controlLabel}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlBtn, isScreenSharing && styles.controlBtnActive]} onPress={handleScreenShare}>
            <Ionicons name={isScreenSharing ? "stop-circle" : "share"} size={22} color={isScreenSharing ? Colors.accent : Colors.textPrimary} />
            <Text style={styles.controlLabel}>{isScreenSharing ? "Stop" : "Share"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Ionicons name="happy" size={22} color={showEmojiPicker ? Colors.gold : Colors.textPrimary} />
            <Text style={styles.controlLabel}>React</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={() => setShowBgMenu(!showBgMenu)}>
            <Ionicons name="person-circle" size={22} color={bgEffect !== "none" ? Colors.secondary : Colors.textPrimary} />
            <Text style={styles.controlLabel}>BG</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => {
              if (transcriptPermission === "granted") setShowTranscript(!showTranscript);
              else if (transcriptPermission === "none") handleRequestTranscript();
            }}
          >
            <Ionicons
              name={transcriptPermission === "granted" ? "document-text" : "document-text-outline"}
              size={22}
              color={transcriptPermission === "granted" ? Colors.success : Colors.textPrimary}
            />
            <Text style={styles.controlLabel}>Record</Text>
          </TouchableOpacity>
        </View>

        {/* End call */}
        <TouchableOpacity style={styles.endCallBtn} onPress={async () => {
          const minutesUsed = Math.max(Math.ceil(callDuration / 60), 1);
          incrementUsage("video", minutesUsed);
          // End Twilio room if connected
          if (params.callId) {
            try {
              await endCallMutation.mutateAsync({ callId: params.callId });
            } catch (e) {
              // Call may already be ended
            }
          }
          router.back();
        }}>
          <Ionicons name="call" size={22} color={Colors.textPrimary} />
          <Text style={styles.endCallText}>End Call</Text>
        </TouchableOpacity>

        {/* Video message option */}
        <TouchableOpacity style={styles.videoMessageBtn}>
          <Ionicons name="videocam" size={16} color={Colors.secondary} />
          <Text style={styles.videoMessageText}>Send Video Message Instead</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Overlay */}
      {showChat && (
        <View style={styles.chatOverlay}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Chat</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.chatMessages}>
            <View style={styles.chatBubbleTeacher}>
              <Text style={styles.chatBubbleText}>¡Hola! ¿Estás listo para practicar?</Text>
              <Text style={styles.chatBubbleTranslation}>Hi! Are you ready to practice?</Text>
            </View>
            <View style={styles.chatBubbleUser}>
              <Text style={styles.chatBubbleText}>Sí, estoy listo!</Text>
            </View>
          </View>
        </View>
      )}

      {/* Transcript Permission Modal */}
      <Modal visible={showPermissionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.permissionModal}>
            <View style={styles.permissionIcon}>
              <Ionicons name="document-text" size={32} color={Colors.secondary} />
            </View>
            <Text style={styles.permissionTitle}>Request Transcript Permission</Text>
            <Text style={styles.permissionDesc}>
              To transcribe this call, the other person must give their consent. A notification will be sent asking for permission.
            </Text>
            <View style={styles.permissionPricing}>
              <Ionicons name="pricetag" size={14} color={Colors.gold} />
              <Text style={styles.permissionPriceText}>$0.49 per call transcript</Text>
            </View>
            <View style={styles.permissionNote}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
              <Text style={styles.permissionNoteText}>
                Both parties must agree. Recording without consent is not allowed.
              </Text>
            </View>
            <TouchableOpacity style={styles.permissionSendBtn} onPress={handleSendPermissionRequest}>
              <Ionicons name="send" size={16} color="#FFFFFF" />
              <Text style={styles.permissionSendText}>Send Permission Request</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.permissionCancelBtn} onPress={() => setShowPermissionModal(false)}>
              <Text style={styles.permissionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Audio Output Picker */}
      <Modal
        visible={showAudioPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAudioPicker(false)}
      >
        <TouchableOpacity
          style={styles.audioPickerOverlay}
          activeOpacity={1}
          onPress={() => setShowAudioPicker(false)}
        >
          <View style={styles.audioPickerSheet}>
            <View style={styles.audioPickerHandle} />
            <Text style={styles.audioPickerTitle}>Audio Output</Text>
            {[
              { key: "phone" as const, icon: "phone-portrait" as const, label: "iPhone", desc: "Ear speaker" },
              { key: "speaker" as const, icon: "volume-high" as const, label: "Speaker", desc: "Built-in speaker" },
              { key: "bluetooth" as const, icon: "bluetooth" as const, label: "Bluetooth", desc: Platform.OS !== "web" ? "Connected device" : "No devices found" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.audioPickerOption,
                  audioRoute === opt.key && styles.audioPickerOptionActive,
                ]}
                onPress={() => {
                  setAudioRoute(opt.key);
                  setIsSpeaker(opt.key === "speaker");
                  setShowAudioPicker(false);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <View style={[
                  styles.audioPickerIconWrap,
                  audioRoute === opt.key && styles.audioPickerIconWrapActive,
                ]}>
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={audioRoute === opt.key ? Colors.secondary : Colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.audioPickerLabel,
                    audioRoute === opt.key && styles.audioPickerLabelActive,
                  ]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.audioPickerDesc}>{opt.desc}</Text>
                </View>
                {audioRoute === opt.key && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // Remote video
  remoteVideo: { flex: 1, backgroundColor: Colors.surfaceCard, justifyContent: "center", alignItems: "center" },
  remoteVideoPlaceholder: { alignItems: "center", gap: 8 },
  remoteAvatar: { fontSize: 64 },
  remoteName: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  remoteDialect: { fontSize: FontSize.sm, color: Colors.textSecondary },

  // Translation overlay
  translationOverlay: { position: "absolute", bottom: 120, left: Spacing.lg, right: Spacing.lg },
  translationBubble: {
    backgroundColor: "rgba(6, 9, 18, 0.90)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  translationHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  translationLabel: { fontSize: 9, fontWeight: "800", color: Colors.secondary, letterSpacing: 0.5 },
  translationText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary, marginBottom: 4 },
  translationEnglish: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: "italic" },

  // Self video
  selfVideo: {
    position: "absolute",
    top: 100,
    right: Spacing.lg,
    width: 100,
    height: 140,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.glowBorder,
  },
  selfVideoPlaceholder: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  selfInitial: { fontSize: 28, fontWeight: "800", color: Colors.secondary },
  cameraOff: { flex: 1, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },

  // Top bar
  topBar: { position: "absolute", top: 0, left: 0, right: 0 },
  topBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  callInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  callTimer: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  wifiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.greenGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  wifiText: { fontSize: 10, fontWeight: "600", color: Colors.success },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  minimizeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  translateToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  translateToggleActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  translateToggleText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textSecondary },

  // Bottom controls
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    paddingTop: Spacing.lg,
    backgroundColor: "rgba(6, 9, 18, 0.95)",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  connectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginBottom: Spacing.md,
  },
  connectionText: { fontSize: 10, color: Colors.textMuted },
  controlRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: Spacing.lg },
  controlBtn: { alignItems: "center", gap: 4 },
  controlBtnActive: {},
  controlLabel: { fontSize: 10, color: Colors.textSecondary },
  endCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  endCallText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  videoMessageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  videoMessageText: { fontSize: FontSize.xs, color: Colors.secondary, fontWeight: "600" },

  // Chat overlay
  chatOverlay: {
    position: "absolute",
    bottom: 200,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: "rgba(6, 9, 18, 0.95)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 250,
  },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  chatTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  chatMessages: { gap: 8 },
  chatBubbleTeacher: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  chatBubbleUser: {
    backgroundColor: Colors.secondary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  chatBubbleText: { fontSize: FontSize.sm, color: Colors.textPrimary },
  chatBubbleTranslation: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3, fontStyle: "italic" },

  // Background effect indicator on self video
  bgEffectIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.secondary + "40",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  // Floating emoji reaction
  floatingReaction: {
    position: "absolute",
    top: height * 0.3,
    right: 30,
    zIndex: 100,
  },
  floatingReactionEmoji: {
    fontSize: 52,
  },

  // Screen share banner
  screenShareBanner: {
    position: "absolute",
    top: 90,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    zIndex: 50,
  },
  screenShareText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  screenShareStop: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: "700",
  },

  // On hold banner
  onHoldBanner: {
    position: "absolute",
    top: 90,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    zIndex: 50,
  },
  onHoldText: {
    fontSize: FontSize.xs,
    color: Colors.gold,
    fontWeight: "600",
    flex: 1,
  },
  onHoldSwap: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "700",
    paddingHorizontal: 8,
  },
  onHoldMerge: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: "700",
    paddingHorizontal: 8,
  },

  // Call waiting overlay
  callWaitingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
    padding: Spacing.xl,
  },
  callWaitingCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  callWaitingAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  callWaitingAvatarText: {
    fontSize: 32,
  },
  callWaitingName: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  callWaitingSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  callWaitingActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  callWaitingDecline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  callWaitingAnswer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.success,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  callWaitingActionText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  // Emoji picker
  emojiPickerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: Spacing.md,
    backgroundColor: "rgba(6, 9, 18, 0.8)",
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignSelf: "center",
  },
  emojiBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnText: {
    fontSize: 18,
  },

  // Background effect menu
  bgMenu: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: Spacing.md,
    backgroundColor: "rgba(6, 9, 18, 0.8)",
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignSelf: "center",
  },
  bgOption: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  bgOptionActive: {
    backgroundColor: Colors.secondary + "25",
  },
  bgOptionText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  bgOptionTextActive: {
    color: Colors.secondary,
  },

  // Permission modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  permissionModal: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  permissionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  permissionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  permissionDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  permissionPricing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.gold + "15",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  permissionPriceText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gold,
  },
  permissionNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.success + "10",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  permissionNoteText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  permissionSendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    width: "100%",
    marginBottom: Spacing.sm,
  },
  permissionSendText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  permissionCancelBtn: {
    paddingVertical: 12,
  },
  permissionCancelText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  // Audio Output Picker
  audioPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  audioPickerSheet: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    paddingTop: Spacing.md,
  },
  audioPickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  audioPickerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  audioPickerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: 6,
  },
  audioPickerOptionActive: {
    backgroundColor: Colors.secondary + "15",
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
  },
  audioPickerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  audioPickerIconWrapActive: {
    backgroundColor: Colors.secondary + "20",
  },
  audioPickerLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  audioPickerLabelActive: {
    color: Colors.secondary,
  },
  audioPickerDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
