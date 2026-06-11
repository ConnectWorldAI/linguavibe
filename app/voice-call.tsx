import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
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

const { width, height } = Dimensions.get("window");

export default function VoiceCallScreen() {
  const { minimizeCall } = usePip();
  const [callState, setCallState] = useState<"connecting" | "active" | "ended">("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [audioRoute, setAudioRoute] = useState<"phone" | "speaker" | "bluetooth">("phone");
  const [showTranscript, setShowTranscript] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  // Transcript permission states
  const [transcriptPermission, setTranscriptPermission] = useState<"none" | "requested" | "granted" | "denied">("none");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  // Screen sharing
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  // Emoji reactions
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  // Call waiting
  const [incomingCall, setIncomingCall] = useState(false);
  const [onHold, setOnHold] = useState(false);

  // Simulate connection
  useEffect(() => {
    const timer = setTimeout(() => setCallState("active"), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Simulate call timer
  useEffect(() => {
    if (callState === "active") {
      const interval = setInterval(() => {
        setCallDuration((d) => d + 1);
        setCreditsUsed((c) => c + 0.5);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const { incrementUsage } = useUsage();

  const handleEndCall = () => {
    // Track usage: convert seconds to minutes (round up)
    const minutesUsed = Math.max(Math.ceil(callDuration / 60), 1);
    incrementUsage("talk", minutesUsed);
    setCallState("ended");
    setTimeout(() => router.back(), 1500);
  };

  // Request transcript permission from other party
  const handleRequestTranscript = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowPermissionModal(true);
  };

  const handleSendPermissionRequest = () => {
    setTranscriptPermission("requested");
    setShowPermissionModal(false);
    // Simulate other party granting permission after 3 seconds
    setTimeout(() => {
      setTranscriptPermission("granted");
      setShowTranscript(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 3000);
  };

  // Screen sharing toggle
  const handleScreenShare = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsScreenSharing(!isScreenSharing);
  };

  // Emoji reaction
  const REACTIONS = ["👍", "❤️", "😂", "😮", "🎉", "🔥"];
  const handleReaction = (emoji: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveReaction(emoji);
    setShowEmojiPicker(false);
    setTimeout(() => setActiveReaction(null), 2500);
  };

  // Call waiting - simulate incoming call after 20 seconds
  useEffect(() => {
    if (callState === "active") {
      const timer = setTimeout(() => setIncomingCall(true), 20000);
      return () => clearTimeout(timer);
    }
  }, [callState]);

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
  };
  const handleSwapCalls = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOnHold(!onHold);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGlow} />

      {/* Call Waiting Incoming Overlay */}
      {incomingCall && (
        <View style={styles.callWaitingOverlay}>
          <View style={styles.callWaitingCard}>
            <View style={styles.callWaitingAvatar}>
              <Text style={styles.callWaitingAvatarEmoji}>👨🏾</Text>
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

      {/* On Hold Banner */}
      {onHold && callState === "active" && (
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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.callInfo}>
          <View style={styles.statusDot} />
          <Text style={styles.callStatus}>
            {callState === "connecting"
              ? "Connecting..."
              : callState === "active"
              ? "In Call"
              : "Call Ended"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {callState === "active" && (
            <TouchableOpacity
              style={styles.minimizeBtn}
              onPress={() => {
                minimizeCall("voice", "Sophia Martinez", "👩🏽");
                router.back();
              }}
            >
              <Ionicons name="chevron-down" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
          <View style={styles.creditsDisplay}>
            <Ionicons name="flash" size={14} color={Colors.warning} />
            <Text style={styles.creditsText}>{creditsUsed.toFixed(1)} credits used</Text>
          </View>
        </View>
      </View>

      {/* Teacher Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          {/* Pulsing ring animation for active call */}
          {callState === "active" && (
            <>
              <View style={[styles.pulseRing, styles.pulseRing1]} />
              <View style={[styles.pulseRing, styles.pulseRing2]} />
            </>
          )}
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>👩🏽</Text>
          </View>
        </View>
        <Text style={styles.teacherName}>Sophia Martinez</Text>
        <Text style={styles.teacherDialect}>🇩🇴 Dominican Spanish Teacher</Text>
        <Text style={styles.callTimer}>{formatTime(callDuration)}</Text>
      </View>

      {/* Topic / Scenario */}
      {callState === "active" && (
        <View style={styles.topicCard}>
          <Ionicons name="chatbubbles" size={16} color={Colors.secondary} />
          <Text style={styles.topicText}>Topic: Ordering food at a restaurant</Text>
        </View>
      )}

      {/* Live Transcript */}
      {showTranscript && callState === "active" && (
        <View style={styles.transcriptContainer}>
          <View style={styles.transcriptBubbleTeacher}>
            <Text style={styles.transcriptSpeaker}>Sophia</Text>
            <Text style={styles.transcriptText}>
              ¡Hola! Bienvenido al restaurante. ¿Qué te gustaría ordenar hoy?
            </Text>
            <Text style={styles.transcriptTranslation}>
              Hi! Welcome to the restaurant. What would you like to order today?
            </Text>
          </View>
          <View style={styles.transcriptBubbleUser}>
            <Text style={styles.transcriptSpeaker}>You</Text>
            <Text style={styles.transcriptText}>
              Quero un jugo de chinola, por favor.
            </Text>
          </View>

          {/* Pronunciation Correction */}
          <View style={styles.correctionCard}>
            <View style={styles.correctionHeader}>
              <Ionicons name="alert-circle" size={16} color={Colors.warning} />
              <Text style={styles.correctionTitle}>Pronunciation Help</Text>
            </View>
            <View style={styles.correctionBody}>
              <View style={styles.correctionRow}>
                <Text style={styles.correctionWrong}>❌ "Quero"</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.textSecondary} />
                <Text style={styles.correctionRight}>✓ "Quiero"</Text>
              </View>
              <Text style={styles.correctionExplanation}>
                You dropped the 'i' — it's "quie-ro" not "que-ro". The 'ie' makes the "yeh" sound.
              </Text>
              <View style={styles.soundItOut}>
                <Text style={styles.soundItOutLabel}>Sound it out:</Text>
                <View style={styles.syllables}>
                  <View style={styles.syllable}>
                    <Text style={styles.syllableText}>Quie</Text>
                    <Text style={styles.syllablePhonetic}>"kyeh"</Text>
                  </View>
                  <Text style={styles.syllableDash}>—</Text>
                  <View style={styles.syllable}>
                    <Text style={styles.syllableText}>ro</Text>
                    <Text style={styles.syllablePhonetic}>"roh"</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.listenAgainBtn}>
                <Ionicons name="volume-high" size={16} color={Colors.textPrimary} />
                <Text style={styles.listenAgainText}>Hear Sophia say it</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.transcriptBubbleTeacher}>
            <Text style={styles.transcriptSpeaker}>Sophia</Text>
            <Text style={styles.transcriptText}>
              Almost! You said "quero" but it's "quiero" — hear the difference? Let's try again. Say: "Quie-ro un jugo."
            </Text>
            <Text style={styles.transcriptTranslation}>
              Let me help you — it's "quiero" with the 'ie' sound. Try again!
            </Text>
          </View>

          <View style={styles.transcriptBubbleUser}>
            <Text style={styles.transcriptSpeaker}>You</Text>
            <Text style={styles.transcriptText}>
              Quiero un jugo de chinola, por favor.
            </Text>
            <View style={styles.pronunciationScore}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.pronunciationScoreText}>Great pronunciation!</Text>
            </View>
          </View>

          <View style={styles.transcriptBubbleTeacher}>
            <Text style={styles.transcriptSpeaker}>Sophia</Text>
            <Text style={styles.transcriptText}>
              ¡Perfecto! 🎉 Much better! "Quiero" — you nailed it. Now, how would you ask how much it costs?
            </Text>
            <Text style={styles.transcriptTranslation}>
              Perfect! Much better! Now, how would you ask how much it costs?
            </Text>
          </View>
        </View>
      )}

      {/* Voice Waveform Indicator */}
      {callState === "active" && (
        <View style={styles.waveformContainer}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: Math.random() * 24 + 8,
                  backgroundColor:
                    i < 10 ? Colors.gold : Colors.secondary,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Floating Emoji Reaction */}
      {activeReaction && (
        <View style={styles.floatingReaction}>
          <Text style={styles.floatingReactionEmoji}>{activeReaction}</Text>
        </View>
      )}

      {/* Screen Sharing Banner */}
      {isScreenSharing && callState === "active" && (
        <View style={styles.screenShareBanner}>
          <Ionicons name="desktop" size={16} color={Colors.textPrimary} />
          <Text style={styles.screenShareText}>You are sharing your screen</Text>
          <TouchableOpacity onPress={handleScreenShare}>
            <Text style={styles.screenShareStop}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Transcript Permission Status */}
      {transcriptPermission === "requested" && callState === "active" && (
        <View style={styles.transcriptRequestBanner}>
          <Ionicons name="hourglass" size={14} color={Colors.gold} />
          <Text style={styles.transcriptRequestText}>Waiting for permission to transcribe...</Text>
        </View>
      )}
      {transcriptPermission === "granted" && callState === "active" && !showTranscript && (
        <View style={styles.transcriptGrantedBanner}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={styles.transcriptGrantedText}>Transcript permission granted</Text>
          <TouchableOpacity onPress={() => setShowTranscript(true)}>
            <Text style={styles.transcriptShowBtn}>Show</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Primary Controls Row */}
        <View style={styles.secondaryControls}>
          {/* Transcript Button - permission gated */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              if (transcriptPermission === "granted") {
                setShowTranscript(!showTranscript);
              } else if (transcriptPermission === "none") {
                handleRequestTranscript();
              }
            }}
          >
            <Ionicons
              name={transcriptPermission === "granted" ? "document-text" : "document-text-outline"}
              size={22}
              color={transcriptPermission === "granted" ? Colors.success : Colors.textSecondary}
            />
            <Text style={styles.controlLabel}>
              {transcriptPermission === "granted" ? "Transcript" : "Record"}
            </Text>
            {transcriptPermission === "none" && (
              <View style={styles.controlBadge}>
                <Text style={styles.controlBadgeText}>$0.49</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Ionicons
              name={isMuted ? "mic-off" : "mic"}
              size={22}
              color={isMuted ? Colors.accent : Colors.textSecondary}
            />
            <Text style={styles.controlLabel}>
              {isMuted ? "Unmute" : "Mute"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, audioRoute !== "phone" && styles.controlButtonActive]}
            onPress={() => {
              setShowAudioPicker(true);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons
              name={audioRoute === "bluetooth" ? "bluetooth" : audioRoute === "speaker" ? "volume-high" : "volume-medium"}
              size={22}
              color={audioRoute !== "phone" ? Colors.accent : Colors.textSecondary}
            />
            <Text style={styles.controlLabel}>
              {audioRoute === "bluetooth" ? "BT" : audioRoute === "speaker" ? "Speaker" : "Audio"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, isScreenSharing && styles.controlButtonActive]}
            onPress={handleScreenShare}
          >
            <Ionicons
              name={isScreenSharing ? "stop-circle" : "share"}
              size={22}
              color={isScreenSharing ? Colors.accent : Colors.textSecondary}
            />
            <Text style={styles.controlLabel}>
              {isScreenSharing ? "Stop" : "Share"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Ionicons name="happy" size={22} color={showEmojiPicker ? Colors.gold : Colors.textSecondary} />
            <Text style={styles.controlLabel}>React</Text>
          </TouchableOpacity>
        </View>

        {/* Emoji Picker Row */}
        {showEmojiPicker && (
          <View style={styles.emojiPickerRow}>
            {REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiBtn}
                onPress={() => handleReaction(emoji)}
              >
                <Text style={styles.emojiBtnText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* End Call Button */}
        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
          <Ionicons name="call" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Credits Warning */}
        <View style={styles.creditsWarning}>
          <Ionicons name="time" size={14} color={Colors.textSecondary} />
          <Text style={styles.creditsWarningText}>
            42 minutes remaining on your plan
          </Text>
        </View>
      </View>

      {/* Transcript Permission Modal (like Teams) */}
      <Modal visible={showPermissionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.permissionModal}>
            <View style={styles.permissionIcon}>
              <Ionicons name="document-text" size={32} color={Colors.secondary} />
            </View>
            <Text style={styles.permissionTitle}>Request Transcript Permission</Text>
            <Text style={styles.permissionDesc}>
              To transcribe this call, the other person must give their consent. A notification will be sent to them asking for permission.
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  backgroundGlow: {
    position: "absolute",
    top: -100,
    left: width / 2 - 150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.secondary,
    opacity: 0.08,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  callInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  callStatus: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  minimizeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  creditsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  creditsText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: "600",
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  avatarContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  pulseRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.secondary,
    opacity: 0.3,
  },
  pulseRing1: {
    width: 140,
    height: 140,
  },
  pulseRing2: {
    width: 170,
    height: 170,
    opacity: 0.15,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.secondary,
    // Logo-inspired neon blue halo
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 12,
  },
  avatarEmoji: {
    fontSize: 56,
  },
  teacherName: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  teacherDialect: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  callTimer: {
    fontSize: FontSize.xxl,
    fontWeight: "300",
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    letterSpacing: 2,
  },
  topicCard: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginBottom: Spacing.md,
  },
  topicText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  transcriptContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  transcriptBubbleTeacher: {
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderTopLeftRadius: 4,
    maxWidth: "85%",
  },
  transcriptBubbleUser: {
    backgroundColor: Colors.secondary + "30",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderTopRightRadius: 4,
    maxWidth: "85%",
    alignSelf: "flex-end",
  },
  transcriptSpeaker: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "700",
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  transcriptTranslation: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: 6,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    gap: 2,
    paddingHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  controlsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  secondaryControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.xl,
  },
  controlButton: {
    alignItems: "center",
    gap: 6,
  },
  controlLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.md,
    transform: [{ rotate: "135deg" }],
  },
  creditsWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  creditsWarningText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  correctionCard: {
    backgroundColor: Colors.warning + "12",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
    overflow: "hidden",
  },
  correctionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.warning + "20",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  correctionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.warning,
  },
  correctionBody: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  correctionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  correctionWrong: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: "600",
    textDecorationLine: "line-through",
  },
  correctionRight: {
    fontSize: FontSize.md,
    color: Colors.success,
    fontWeight: "700",
  },
  correctionExplanation: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  soundItOut: {
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  soundItOutLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  syllables: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  syllable: {
    alignItems: "center",
    backgroundColor: Colors.secondary + "20",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  syllableText: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.secondary,
  },
  syllablePhonetic: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  syllableDash: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  listenAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  listenAgainText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  pronunciationScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.success + "30",
  },
  pronunciationScoreText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: "600",
  },
  // Floating Emoji Reaction
  floatingReaction: {
    position: "absolute",
    top: height * 0.35,
    right: 30,
    zIndex: 100,
  },
  floatingReactionEmoji: {
    fontSize: 48,
  },
  // Screen Share Banner
  screenShareBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent + "25",
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent + "50",
    marginBottom: 8,
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
  // Transcript Request/Granted Banners
  transcriptRequestBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.gold + "15",
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    marginBottom: 8,
  },
  transcriptRequestText: {
    fontSize: FontSize.xs,
    color: Colors.gold,
    fontWeight: "500",
  },
  transcriptGrantedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.success + "15",
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.success + "30",
    marginBottom: 8,
  },
  transcriptGrantedText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: "500",
  },
  transcriptShowBtn: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "700",
  },
  // Control Button Active State
  controlButtonActive: {
    backgroundColor: Colors.accent + "20",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  // Control Badge (price)
  controlBadge: {
    position: "absolute",
    top: -6,
    right: -12,
    backgroundColor: Colors.gold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  controlBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: Colors.primary,
  },
  // Emoji Picker
  emojiPickerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignSelf: "center",
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnText: {
    fontSize: 20,
  },
  // Permission Modal
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
  // Call Waiting Overlay
  callWaitingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
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
  callWaitingAvatarEmoji: {
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
  // On Hold Banner
  onHoldBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.gold + "15",
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    marginBottom: 8,
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
