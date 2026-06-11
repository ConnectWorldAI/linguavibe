import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Clipboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  DuelMultiplayerClient,
  getDuelMultiplayerClient,
  type MultiplayerState,
  type MultiplayerEvent,
} from "@/lib/duel-multiplayer";
import {
  getMatchmakingProfile,
  recordMatchResult,
  getRankForRating,
  getSearchRadius,
  getWinRate,
  getRankProgress,
  generateSimulatedOpponents,
  findBestMatch,
  createQueueStatus,
  isQueueTimedOut,
  type MatchmakingProfile,
  type QueueStatus,
} from "@/lib/matchmaking";
import { shareDuelChallenge } from "@/lib/friend-invites";

type ScreenPhase = "choose" | "create" | "join" | "waiting" | "matched" | "playing" | "results";

export default function DuelMultiplayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    category?: string;
    difficulty?: string;
    language?: string;
    playerName?: string;
  }>();

  const [phase, setPhase] = useState<ScreenPhase>("choose");
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [mpState, setMpState] = useState<MultiplayerState>("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState(0);
    const [opponentSpeaking, setOpponentSpeaking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [matchProfile, setMatchProfile] = useState<MatchmakingProfile | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const queueTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clientRef = useRef<DuelMultiplayerClient | null>(null);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withRepeat(withTiming(1.15, { duration: 1000 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  useEffect(() => {
    const client = getDuelMultiplayerClient();
    clientRef.current = client;

    const unsubState = client.on("state_change", (e) => {
      setMpState(e.to as MultiplayerState);
    });

    const unsubQueued = client.on("queued", (e) => {
      setQueuePosition(e.position);
    });

    const unsubRoomCreated = client.on("room_created", (e) => {
      setRoomCode(e.roomCode);
      setPhase("waiting");
    });

    const unsubMatched = client.on("matched", (e) => {
      setOpponentName(e.opponent);
      setPhase("matched");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    const unsubOpponentJoined = client.on("opponent_joined", (e) => {
      setOpponentName(e.opponent);
      setPhase("matched");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    const unsubRoundStart = client.on("round_start", (e) => {
      setCurrentRound(e.round);
      setTotalRounds(e.totalRounds);
      setPhase("playing");
    });

    const unsubMatchComplete = client.on("match_complete", (e) => {
      setPhase("results");
      // Navigate to results screen with match data
      router.replace({
        pathname: "/pronunciation-duel-results" as any,
        params: { fromGame: "multiplayer" },
      });
    });

    const unsubOpponentLeft = client.on("opponent_left", () => {
      Alert.alert("Opponent Left", "Your opponent has left the duel. You win by default!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    });

    const unsubError = client.on("error", (e) => {
      setError(e.message);
    });

    const unsubVoice = client.on("voice_audio", (e) => {
      setOpponentSpeaking(e.speaking);
    });

    return () => {
      unsubState();
      unsubQueued();
      unsubRoomCreated();
      unsubMatched();
      unsubOpponentJoined();
      unsubRoundStart();
      unsubMatchComplete();
      unsubOpponentLeft();
      unsubError();
      unsubVoice();
    };
  }, []);

  const handleCreateRoom = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    try {
      const client = clientRef.current!;
      await client.connect();
      client.createRoom(params.playerName || "Player", {
        mode: params.mode || "word_flash",
        category: params.category || "mixed",
        difficulty: params.difficulty || "medium",
        language: params.language || "Spanish",
      });
      setPhase("waiting");
    } catch (err: any) {
      setError("Failed to connect. Check your internet connection.");
    }
  };

  const handleJoinRoom = async () => {
    if (!inputCode.trim() || inputCode.trim().length < 4) {
      setError("Please enter a valid room code.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    try {
      const client = clientRef.current!;
      await client.connect();
      client.joinRoom(params.playerName || "Player", inputCode.trim());
    } catch (err: any) {
      setError("Failed to connect. Check your internet connection.");
    }
  };

  // Load matchmaking profile on mount
  useEffect(() => {
    getMatchmakingProfile().then(setMatchProfile);
  }, []);

  const handleQuickMatch = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    try {
      const client = clientRef.current!;
      await client.connect();
      client.joinQueue(params.playerName || "Player");
    } catch (err: any) {
      setError("Failed to connect. Check your internet connection.");
    }
  };

  const handleRankedMatch = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setError(null);
    const profile = await getMatchmakingProfile();
    setMatchProfile(profile);
    const startTime = Date.now();
    setQueueStatus(createQueueStatus(true, startTime, profile.rating));
    setPhase("waiting");

    // Simulate matchmaking with expanding search radius
    queueTimerRef.current = setInterval(() => {
      const status = createQueueStatus(true, startTime, profile.rating);
      setQueueStatus(status);

      if (isQueueTimedOut(startTime)) {
        if (queueTimerRef.current) clearInterval(queueTimerRef.current);
        setError("No opponents found. Try Quick Match or create a room.");
        setPhase("choose");
        return;
      }

      // Simulate finding an opponent after 5-15 seconds
      if (status.currentWaitSeconds >= 5 + Math.floor(Math.random() * 10)) {
        if (queueTimerRef.current) clearInterval(queueTimerRef.current);
        const opponents = generateSimulatedOpponents(profile.rating, 5, profile.preferredLanguage);
        const bestMatch = findBestMatch(profile.rating, profile.preferredLanguage, opponents, status.searchRadius);
        if (bestMatch) {
          setOpponentName(bestMatch.name);
          setMpState("matched");
          setPhase("matched");
        }
      }
    }, 1000);
  };

  // Cleanup queue timer
  useEffect(() => {
    return () => {
      if (queueTimerRef.current) clearInterval(queueTimerRef.current);
    };
  }, []);

  const handleReady = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    clientRef.current?.sendReady();
  };

  const handleCopyCode = () => {
    if (roomCode) {
      if (Platform.OS !== "web") {
        Clipboard.setString(roomCode);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Alert.alert("Copied!", `Room code "${roomCode}" copied to clipboard. Share it with your friend!`);
    }
  };

  const handleLeave = () => {
    clientRef.current?.leave();
    router.back();
  };

  // ─── Render Phases ──────────────────────────────────────────────────

  const renderChoosePhase = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.heroSection}>
        <Animated.View style={[styles.heroIcon, pulseStyle]}>
          <Ionicons name="people" size={48} color={Colors.secondary} />
        </Animated.View>
        <Text style={styles.heroTitle}>Multiplayer Duel</Text>
        <Text style={styles.heroSubtitle}>Challenge a friend or find an opponent</Text>
      </View>

      {/* Rank Badge */}
      {matchProfile && (
        <View style={styles.rankBadgeRow}>
          <Text style={{ fontSize: 20 }}>{getRankForRating(matchProfile.rating).icon}</Text>
          <View style={{ marginLeft: 8 }}>
            <Text style={[styles.optionTitle, { marginBottom: 0 }]}>
              {getRankForRating(matchProfile.rating).label} • {matchProfile.rating} ELO
            </Text>
            <Text style={styles.optionDesc}>
              {matchProfile.wins}W / {matchProfile.losses}L • {getWinRate(matchProfile)}% win rate
            </Text>
          </View>
        </View>
      )}

      <View style={styles.optionsContainer}>
        {/* Ranked Match */}
        <TouchableOpacity style={styles.optionCard} onPress={handleRankedMatch} activeOpacity={0.8}>
          <View style={[styles.optionIcon, { backgroundColor: "#FFD70015" }]}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Ranked Match</Text>
            <Text style={styles.optionDesc}>Skill-based matchmaking • Earn ELO</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Quick Match */}
        <TouchableOpacity style={styles.optionCard} onPress={handleQuickMatch} activeOpacity={0.8}>
          <View style={[styles.optionIcon, { backgroundColor: Colors.success + "15" }]}>
            <Ionicons name="flash" size={24} color={Colors.success} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Quick Match</Text>
            <Text style={styles.optionDesc}>Find a random opponent instantly</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Create Room */}
        <TouchableOpacity style={styles.optionCard} onPress={handleCreateRoom} activeOpacity={0.8}>
          <View style={[styles.optionIcon, { backgroundColor: Colors.secondary + "15" }]}>
            <Ionicons name="add-circle" size={24} color={Colors.secondary} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Create Room</Text>
            <Text style={styles.optionDesc}>Get a code to share with a friend</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Join Room */}
        <TouchableOpacity style={styles.optionCard} onPress={() => setPhase("join")} activeOpacity={0.8}>
          <View style={[styles.optionIcon, { backgroundColor: Colors.gold + "15" }]}>
            <Ionicons name="enter" size={24} color={Colors.gold} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Join Room</Text>
            <Text style={styles.optionDesc}>Enter a friend's room code</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Challenge a Friend */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => shareDuelChallenge(
            params.playerName || "Player",
            params.language || "Spanish",
            params.difficulty || "medium"
          )}
          activeOpacity={0.8}
        >
          <View style={[styles.optionIcon, { backgroundColor: "#FF634715" }]}>
            <Ionicons name="share-social" size={24} color="#FF6347" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Challenge a Friend</Text>
            <Text style={styles.optionDesc}>Send a duel invite link via messages</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderJoinPhase = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.joinSection}>
        <Ionicons name="key" size={40} color={Colors.gold} />
        <Text style={styles.joinTitle}>Enter Room Code</Text>
        <Text style={styles.joinSubtext}>Ask your friend for their 6-character code</Text>

        <TextInput
          style={styles.codeInput}
          value={inputCode}
          onChangeText={(t) => setInputCode(t.toUpperCase())}
          placeholder="ABC123"
          placeholderTextColor={Colors.textMuted}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleJoinRoom}
        />

        <TouchableOpacity style={styles.joinBtn} onPress={handleJoinRoom} activeOpacity={0.8}>
          <Ionicons name="enter" size={20} color="#fff" />
          <Text style={styles.joinBtnText}>Join Room</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => setPhase("choose")}>
          <Text style={styles.cancelBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWaitingPhase = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.waitingSection}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.waitingTitle}>
          {mpState === "queued" ? "Finding Opponent..." : "Waiting for Friend..."}
        </Text>

        {roomCode ? (
          <View style={styles.codeDisplay}>
            <Text style={styles.codeLabel}>Room Code</Text>
            <TouchableOpacity style={styles.codeBox} onPress={handleCopyCode} activeOpacity={0.7}>
              <Text style={styles.codeText}>{roomCode}</Text>
              <Ionicons name="copy" size={18} color={Colors.secondary} />
            </TouchableOpacity>
            <Text style={styles.codeHint}>Tap to copy • Share with your friend</Text>
          </View>
        ) : (
          <Text style={styles.waitingSubtext}>
            {mpState === "queued" ? `Queue position: ${queuePosition}` : "Connecting..."}
          </Text>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={handleLeave}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMatchedPhase = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.matchedSection}>
        <View style={styles.vsDisplay}>
          <View style={styles.playerAvatar}>
            <Ionicons name="person" size={28} color={Colors.secondary} />
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={[styles.playerAvatar, { backgroundColor: Colors.accent + "15" }]}>
            <Ionicons name="person" size={28} color={Colors.accent} />
          </View>
        </View>
        <Text style={styles.matchedTitle}>Matched!</Text>
        <Text style={styles.matchedOpponent}>vs {opponentName}</Text>
        <Text style={styles.matchedMode}>
          {params.mode === "tongue_twister" ? "Tongue Twister" : params.mode === "phrase_race" ? "Phrase Race" : "Word Flash"} • {totalRounds} rounds
        </Text>

        <TouchableOpacity style={styles.readyBtn} onPress={handleReady} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.readyBtnText}>Ready!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleStartSpeaking = () => {
    setIsSpeaking(true);
    clientRef.current?.sendSpeakingState(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleStopSpeaking = () => {
    setIsSpeaking(false);
    clientRef.current?.sendSpeakingState(false);
  };

  const renderPlayingPhase = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.playingSection}>
        <Text style={styles.playingRound}>Round {currentRound} / {totalRounds}</Text>
        <Text style={styles.playingTitle}>{params.language || "Spanish"} Duel</Text>

        {/* Voice Activity Indicators */}
        <View style={styles.voiceIndicatorRow}>
          {/* Your speaking state */}
          <View style={styles.voiceIndicator}>
            <View style={[
              styles.voiceCircle,
              isSpeaking && { backgroundColor: Colors.success, borderColor: Colors.success },
            ]}>
              <Ionicons name="mic" size={24} color={isSpeaking ? "#fff" : Colors.textMuted} />
            </View>
            <Text style={styles.voiceLabel}>You</Text>
            <Text style={[styles.voiceStatus, isSpeaking && { color: Colors.success }]}>
              {isSpeaking ? "Speaking" : "Listening"}
            </Text>
          </View>

          {/* VS divider */}
          <View style={styles.voiceDivider}>
            <Ionicons name="radio" size={20} color={Colors.secondary} />
            <Text style={styles.voiceLive}>LIVE</Text>
          </View>

          {/* Opponent speaking state */}
          <View style={styles.voiceIndicator}>
            <View style={[
              styles.voiceCircle,
              opponentSpeaking && { backgroundColor: Colors.accent, borderColor: Colors.accent },
            ]}>
              <Ionicons name="ear" size={24} color={opponentSpeaking ? "#fff" : Colors.textMuted} />
            </View>
            <Text style={styles.voiceLabel}>{opponentName || "Opponent"}</Text>
            <Text style={[styles.voiceStatus, opponentSpeaking && { color: Colors.accent }]}>
              {opponentSpeaking ? "Speaking" : "Listening"}
            </Text>
          </View>
        </View>

        {/* Recording Controls */}
        <TouchableOpacity
          style={[
            styles.recordBtn,
            isSpeaking && { backgroundColor: Colors.accent },
          ]}
          onPress={isSpeaking ? handleStopSpeaking : handleStartSpeaking}
          activeOpacity={0.8}
        >
          <Ionicons name={isSpeaking ? "stop" : "mic"} size={28} color="#fff" />
          <Text style={styles.recordBtnText}>
            {isSpeaking ? "Stop Recording" : "Start Speaking"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.playingSubtext}>Speak clearly — your opponent can hear you in real time!</Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeave} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {phase === "choose" ? "Multiplayer" : phase === "waiting" ? "Waiting..." : phase === "matched" ? "Ready Up" : "Live Duel"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.accent} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={16} color={Colors.accent} />
          </TouchableOpacity>
        </View>
      )}

      {/* Phase Content */}
      {phase === "choose" && renderChoosePhase()}
      {phase === "join" && renderJoinPhase()}
      {phase === "waiting" && renderWaitingPhase()}
      {phase === "matched" && renderMatchedPhase()}
      {phase === "playing" && renderPlayingPhase()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent + "15",
    borderWidth: 1,
    borderColor: Colors.accent + "40",
  },
  errorText: { flex: 1, fontSize: FontSize.sm, color: Colors.accent },
  phaseContainer: { flex: 1, paddingHorizontal: 16 },
  rankBadgeRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 12, marginBottom: 16 },
  heroSection: { alignItems: "center", paddingTop: 40, marginBottom: 32 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.textPrimary },
  heroSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  optionsContainer: { gap: 12 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  optionInfo: { flex: 1, marginLeft: 14 },
  optionTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  optionDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  joinSection: { alignItems: "center", paddingTop: 60 },
  joinTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginTop: 16 },
  joinSubtext: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4, marginBottom: 24 },
  codeInput: {
    width: "80%",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 8,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 2,
    borderColor: Colors.border,
    color: Colors.textPrimary,
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gold,
  },
  joinBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#fff" },
  cancelBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20 },
  cancelBtnText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: "600" },
  waitingSection: { alignItems: "center", paddingTop: 80 },
  waitingTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginTop: 20 },
  waitingSubtext: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 8 },
  codeDisplay: { alignItems: "center", marginTop: 28 },
  codeLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 8 },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 2,
    borderColor: Colors.secondary + "40",
  },
  codeText: { fontSize: 28, fontWeight: "900", letterSpacing: 6, color: Colors.secondary },
  codeHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 8 },
  matchedSection: { alignItems: "center", paddingTop: 60 },
  vsDisplay: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 20 },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: { fontSize: FontSize.lg, fontWeight: "900", color: Colors.textMuted },
  matchedTitle: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.success },
  matchedOpponent: { fontSize: FontSize.md, color: Colors.textPrimary, marginTop: 4 },
  matchedMode: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 8 },
  readyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 32,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.success,
  },
  readyBtnText: { fontSize: FontSize.lg, fontWeight: "700", color: "#fff" },
  playingSection: { alignItems: "center", paddingTop: 40 },
  playingRound: { fontSize: FontSize.md, fontWeight: "700", color: Colors.secondary },
  playingTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginTop: 12 },
  playingSubtext: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 16, textAlign: "center", paddingHorizontal: 20 },
  voiceIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 32,
    marginBottom: 24,
  },
  voiceIndicator: { alignItems: "center", gap: 6 },
  voiceCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceLabel: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textPrimary },
  voiceStatus: { fontSize: FontSize.xs, color: Colors.textMuted },
  voiceDivider: { alignItems: "center", gap: 4 },
  voiceLive: { fontSize: 10, fontWeight: "800", color: Colors.accent, letterSpacing: 2 },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.success,
  },
  recordBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#fff" },
});
