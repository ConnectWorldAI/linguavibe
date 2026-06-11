import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/Colors";
import { trpc } from "@/lib/trpc";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";

const DEMO_DURATION = 60; // 60 seconds max

interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function DemoCallScreen() {
  const { showStreakToast } = useUsage();
  const [callState, setCallState] = useState<"intro" | "connecting" | "active" | "ended">("intro");
  const [timeRemaining, setTimeRemaining] = useState(DEMO_DURATION);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchangeCount, setExchangeCount] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<any>(null);
  const micCaptureRef = useRef<any>(null);
  const sessionIdRef = useRef<string | null>(null);

  // tRPC mutation for demo token (public, no auth required)
  const getDemoToken = trpc.hume.getDemoToken.useMutation();

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Timer countdown during active call
  useEffect(() => {
    if (callState === "active") {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            endCall();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectHume();
    };
  }, []);

  // ─── Audio Helpers (Web only for preview) ─────────────────────────────────

  const initAudioPlayer = () => {
    if (Platform.OS === "web" && typeof AudioContext !== "undefined") {
      audioPlayerRef.current = {
        ctx: new AudioContext({ sampleRate: 24000 }),
        queue: [] as ArrayBuffer[],
        isPlaying: false,
        async play(base64: string) {
          try {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            this.queue.push(bytes.buffer);
            if (!this.isPlaying) this.processQueue();
          } catch (e) { /* ignore decode errors */ }
        },
        async processQueue() {
          if (!this.ctx || this.queue.length === 0) { this.isPlaying = false; return; }
          this.isPlaying = true;
          const buffer = this.queue.shift()!;
          try {
            const audioBuffer = await this.ctx.decodeAudioData(buffer.slice(0));
            const source = this.ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.ctx.destination);
            source.onended = () => this.processQueue();
            source.start();
          } catch {
            // Try raw PCM fallback
            try {
              const pcm = new Int16Array(buffer);
              const floats = new Float32Array(pcm.length);
              for (let i = 0; i < pcm.length; i++) floats[i] = pcm[i] / 32768;
              const ab = this.ctx!.createBuffer(1, floats.length, 24000);
              ab.getChannelData(0).set(floats);
              const src = this.ctx!.createBufferSource();
              src.buffer = ab;
              src.connect(this.ctx!.destination);
              src.onended = () => this.processQueue();
              src.start();
            } catch { this.processQueue(); }
          }
        },
        stop() { this.queue = []; this.isPlaying = false; },
        destroy() { this.stop(); this.ctx?.close(); this.ctx = null; },
      };
    }
  };

  const startMicCapture = (onChunk: (base64: string) => void) => {
    if (Platform.OS !== "web") return;
    navigator.mediaDevices?.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } })
      .then(stream => {
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
        micCaptureRef.current = { stream, recorder };
        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0 && !isMuted) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(",")[1];
              if (base64) onChunk(base64);
            };
            reader.readAsDataURL(e.data);
          }
        };
        recorder.start(250); // 250ms chunks
      })
      .catch(err => {
        console.warn("[DemoCall] Mic access denied:", err);
        setError("Microphone access required for the demo call");
      });
  };

  const stopMicCapture = () => {
    if (micCaptureRef.current) {
      micCaptureRef.current.recorder?.stop();
      micCaptureRef.current.stream?.getTracks().forEach((t: any) => t.stop());
      micCaptureRef.current = null;
    }
  };

  // ─── Hume WebSocket Connection ─────────────────────────────────────────────

  const connectToHume = async () => {
    try {
      const result = await getDemoToken.mutateAsync({ language: "Spanish" });

      if (!result.success) {
        throw new Error(result.error || "Failed to get demo token");
      }

      const { accessToken, configId, sessionId, websocketUrl } = result;
      sessionIdRef.current = sessionId;

      // Build WebSocket URL
      const wsUrl = `${websocketUrl}?access_token=${accessToken}&config_id=${configId}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setCallState("active");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Initialize audio
        initAudioPlayer();

        // Start mic capture and stream to Hume
        startMicCapture((base64Audio) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "audio_input", data: base64Audio }));
          }
        });
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleHumeMessage(msg);
        } catch { /* ignore parse errors */ }
      };

      ws.onerror = (e) => {
        console.warn("[DemoCall] WebSocket error:", e);
        setError("Connection error. Please try again.");
        setCallState("ended");
      };

      ws.onclose = () => {
        stopMicCapture();
        audioPlayerRef.current?.destroy();
      };
    } catch (err: any) {
      console.error("[DemoCall] Connection failed:", err);
      setError(err.message || "Failed to connect");
      setCallState("ended");
    }
  };

  const handleHumeMessage = (msg: any) => {
    switch (msg.type) {
      case "user_message": {
        const content = msg.message?.content || "";
        if (content.trim()) {
          setTranscript(prev => [...prev, { role: "user", content, timestamp: Date.now() }]);
          setExchangeCount(prev => prev + 1);
        }
        break;
      }
      case "assistant_message": {
        const content = msg.message?.content || "";
        if (content.trim()) {
          setCurrentSpeech(content);
          setTranscript(prev => [...prev, { role: "assistant", content, timestamp: Date.now() }]);
          setIsAISpeaking(true);
        }
        break;
      }
      case "audio_output": {
        if (msg.data && audioPlayerRef.current && isSpeakerOn) {
          audioPlayerRef.current.play(msg.data);
        }
        break;
      }
      case "assistant_end": {
        setIsAISpeaking(false);
        break;
      }
    }
  };

  const disconnectHume = () => {
    stopMicCapture();
    audioPlayerRef.current?.destroy();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // ─── Call Controls ─────────────────────────────────────────────────────────

  const startCall = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCallState("connecting");
    setError(null);
    connectToHume();
  };

  const endCall = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    disconnectHume();
    setCallState("ended");
    if (timerRef.current) clearInterval(timerRef.current);
    markPracticeAndToast(showStreakToast);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Mute/unmute the mic stream
    if (micCaptureRef.current?.stream) {
      micCaptureRef.current.stream.getAudioTracks().forEach((track: any) => {
        track.enabled = isMuted; // Toggle (was muted, now unmuting)
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── INTRO STATE ───────────────────────────────────────────────────────────

  if (callState === "intro") {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.introContent}>
          <View style={styles.demoBadge}>
            <Ionicons name="sparkles" size={14} color={Colors.gold} />
            <Text style={styles.demoBadgeText}>FREE DEMO</Text>
          </View>

          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👩‍🏫</Text>
            </View>
            <View style={styles.avatarGlow} />
          </Animated.View>

          <Text style={styles.introTitle}>Try a Live AI Call</Text>
          <Text style={styles.introSubtitle}>
            Experience a 60-second conversation with our AI Spanish teacher.{"\n"}
            No sign-up required. Real AI, real voice.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <Ionicons name="mic" size={18} color={Colors.primary} />
              <Text style={styles.featureText}>Real-time voice conversation with Hume AI</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="language" size={18} color={Colors.primary} />
              <Text style={styles.featureText}>Live transcription + translation</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="heart" size={18} color={Colors.primary} />
              <Text style={styles.featureText}>Emotional AI that adapts to your mood</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={startCall} activeOpacity={0.8}>
            <Ionicons name="call" size={22} color="#fff" />
            <Text style={styles.startBtnText}>Start Free Call</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            60 seconds • No account needed • Microphone required
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── CONNECTING STATE ──────────────────────────────────────────────────────

  if (callState === "connecting") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.connectingContent}>
          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👩‍🏫</Text>
            </View>
          </Animated.View>
          <Text style={styles.connectingText}>Connecting to Profesora María...</Text>
          <Text style={styles.connectingSubtext}>Setting up live AI voice session</Text>
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── ENDED STATE ───────────────────────────────────────────────────────────

  if (callState === "ended") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.endedContent}>
          <View style={styles.endedIcon}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.endedTitle}>Great First Call!</Text>
          <Text style={styles.endedSubtitle}>
            You just experienced ConnectWorld AI's live voice technology.{"\n"}
            Sign up to unlock unlimited calls with 34 AI teachers across 40+ languages.
          </Text>

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.endedStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{DEMO_DURATION - timeRemaining}s</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{exchangeCount}</Text>
              <Text style={styles.statLabel}>Exchanges</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{transcript.filter(t => t.role === "assistant").length}</Text>
              <Text style={styles.statLabel}>AI Responses</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.signUpBtn}
            onPress={() => router.replace("/onboarding" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.signUpBtnText}>Sign Up Free</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tryAgainBtn}
            onPress={() => {
              setCallState("intro");
              setTimeRemaining(DEMO_DURATION);
              setTranscript([]);
              setCurrentSpeech("");
              setExchangeCount(0);
              setError(null);
            }}
          >
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── ACTIVE CALL STATE ─────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.activeContent, { opacity: fadeAnim }]}>
        {/* Timer */}
        <View style={styles.timerRow}>
          <View style={styles.timerBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
          <Text style={styles.demoLabel}>LIVE DEMO</Text>
        </View>

        {/* Avatar */}
        <Animated.View style={[styles.activeAvatar, { transform: [{ scale: isAISpeaking ? pulseAnim : 1 }] }]}>
          <View style={styles.avatarLarge}>
            <Text style={{ fontSize: 48 }}>👩‍🏫</Text>
          </View>
          <Text style={styles.teacherName}>Profesora María</Text>
          <Text style={styles.teacherLang}>Spanish • Live AI Voice</Text>
        </Animated.View>

        {/* Live Transcript */}
        <View style={styles.transcriptContainer}>
          <ScrollView style={styles.transcriptScroll} contentContainerStyle={{ paddingBottom: 8 }}>
            {transcript.slice(-4).map((msg, i) => (
              <View key={i} style={[styles.msgBubble, msg.role === "user" ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.msgText, msg.role === "user" && styles.userMsgText]}>
                  {msg.content}
                </Text>
              </View>
            ))}
            {currentSpeech && isAISpeaking && (
              <View style={[styles.msgBubble, styles.aiBubble, styles.speakingBubble]}>
                <Text style={styles.msgText}>{currentSpeech}</Text>
                <View style={styles.speakingDots}>
                  <View style={styles.dot} />
                  <View style={[styles.dot, { opacity: 0.6 }]} />
                  <View style={[styles.dot, { opacity: 0.3 }]} />
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={toggleMute}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color={isMuted ? "#fff" : Colors.textPrimary} />
            <Text style={[styles.controlLabel, isMuted && styles.controlLabelActive]}>
              {isMuted ? "Unmute" : "Mute"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
            <Ionicons name="call" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isSpeakerOn && styles.controlBtnActive]}
            onPress={() => {
              setIsSpeakerOn(!isSpeakerOn);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name={isSpeakerOn ? "volume-high" : "volume-mute"} size={24} color={isSpeakerOn ? "#fff" : Colors.textPrimary} />
            <Text style={[styles.controlLabel, isSpeakerOn && styles.controlLabelActive]}>
              Speaker
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upgrade prompt */}
        <View style={styles.upgradeHint}>
          <Text style={styles.upgradeHintText}>
            ⏱ {timeRemaining}s remaining • Sign up for unlimited calls
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backBtn: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  // Intro
  introContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  demoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.gold}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  demoBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.gold,
  },
  avatarContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 48,
  },
  avatarGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.primary}08`,
    top: -10,
  },
  introTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  featureList: {
    width: "100%",
    gap: 12,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.success,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  // Connecting
  connectingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  connectingText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 16,
  },
  connectingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.error}15`,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    flex: 1,
  },
  // Ended
  endedContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  endedIcon: {
    marginBottom: 16,
  },
  endedTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  endedSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  endedStats: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 28,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  signUpBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
  },
  signUpBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  tryAgainBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 8,
  },
  tryAgainText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
  },
  backLink: {
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  // Active Call
  activeContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${Colors.error}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.error,
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  activeAvatar: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  teacherLang: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Transcript
  transcriptContainer: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  transcriptScroll: {
    flex: 1,
  },
  msgBubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: `${Colors.primary}15`,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  speakingBubble: {
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  msgText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  userMsgText: {
    color: "#fff",
  },
  speakingDots: {
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  // Controls
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginBottom: 12,
  },
  controlBtn: {
    alignItems: "center",
    gap: 4,
    width: 64,
    paddingVertical: 10,
    borderRadius: 16,
  },
  controlBtnActive: {
    backgroundColor: Colors.primary,
  },
  controlLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  controlLabelActive: {
    color: "#fff",
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "135deg" }],
  },
  upgradeHint: {
    alignItems: "center",
    paddingBottom: 8,
  },
  upgradeHintText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
