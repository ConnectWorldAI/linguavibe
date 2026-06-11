import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Share,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as Speech from "expo-speech";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  type DuelReplay,
  type ReplayRoundData,
  type ReplayHighlight,
  type ReplayPlaybackState,
  getReplayById,
  getReplayByMatchId,
  detectHighlights,
  generateReplayShare,
  createPlaybackState,
} from "@/lib/duel-replay";

type ViewMode = "playback" | "highlights" | "stats";

export default function DuelReplayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ replayId?: string; matchId?: string }>();

  const [replay, setReplay] = useState<DuelReplay | null>(null);
  const [playback, setPlayback] = useState<ReplayPlaybackState | null>(null);
  const [highlights, setHighlights] = useState<ReplayHighlight[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("playback");
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Voice comparison state
  const [isSpeakingNative, setIsSpeakingNative] = useState(false);
  const [isSpeakingUser, setIsSpeakingUser] = useState(false);
  const [voiceCompareMode, setVoiceCompareMode] = useState(false);

  // Load replay data
  useEffect(() => {
    loadReplay();
  }, []);

  const loadReplay = async () => {
    let loaded: DuelReplay | null = null;
    if (params.replayId) {
      loaded = await getReplayById(params.replayId);
    } else if (params.matchId) {
      loaded = await getReplayByMatchId(params.matchId);
    }
    if (loaded) {
      setReplay(loaded);
      setPlayback(createPlaybackState(loaded));
      setHighlights(detectHighlights(loaded));
    }
  };

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying || !playback || !replay) return;
    const round = replay.rounds[playback.currentRound];
    if (!round) {
      setIsAutoPlaying(false);
      return;
    }
    const delay = Math.max(2000, round.recordingDurationMs) / playback.speed;
    autoPlayTimer.current = setTimeout(() => {
      handleNextRound();
    }, delay);
    return () => {
      if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
    };
  }, [isAutoPlaying, playback?.currentRound, playback?.speed]);

  const handleNextRound = useCallback(() => {
    if (!playback || !replay) return;
    const next = playback.currentRound + 1;
    if (next >= replay.rounds.length) {
      setIsAutoPlaying(false);
      setPlayback(p => p ? { ...p, currentRound: replay.rounds.length - 1, isPlaying: false } : null);
    } else {
      setPlayback(p => p ? { ...p, currentRound: next } : null);
    }
  }, [playback, replay]);

  const handlePrevRound = () => {
    if (!playback) return;
    const prev = Math.max(0, playback.currentRound - 1);
    setPlayback(p => p ? { ...p, currentRound: prev } : null);
  };

  const handleToggleAutoPlay = () => {
    if (!replay || !playback) return;
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
    } else {
      // If at end, restart
      if (playback.currentRound >= replay.rounds.length - 1) {
        setPlayback(p => p ? { ...p, currentRound: 0 } : null);
      }
      setIsAutoPlaying(true);
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSpeedChange = () => {
    if (!playback) return;
    const speeds: (1 | 1.5 | 2)[] = [1, 1.5, 2];
    const idx = speeds.indexOf(playback.speed);
    const next = speeds[(idx + 1) % speeds.length];
    setPlayback(p => p ? { ...p, speed: next } : null);
  };

  const handleShare = async (format: "story" | "clip" | "full_replay") => {
    if (!replay) return;
    const shareData = generateReplayShare(replay, format);
    try {
      await Share.share({ message: shareData.shareText });
    } catch (err) {
      // User cancelled
    }
  };

  const handleJumpToRound = (roundIdx: number) => {
    setPlayback(p => p ? { ...p, currentRound: roundIdx } : null);
    setIsAutoPlaying(false);
    setViewMode("playback");
  };

  if (!replay || !playback) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <Ionicons name="film-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Loading replay...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const currentRound = replay.rounds[playback.currentRound];
  const resultEmoji = replay.winner === "player" ? "🏆" : replay.winner === "tie" ? "🤝" : "💪";
  const progress = (playback.currentRound + 1) / replay.rounds.length;

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Duel Replay</Text>
            <Text style={styles.headerSubtitle}>
              {replay.language} • {replay.mode === "word_flash" ? "Word Flash" : replay.mode === "phrase_race" ? "Phrase Race" : "Tongue Twister"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleShare("story")} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Score Banner */}
        <View style={styles.scoreBanner}>
          <View style={styles.scorePlayer}>
            <Text style={styles.scoreLabel}>{replay.playerName}</Text>
            <Text style={[styles.scoreValue, replay.winner === "player" && styles.winnerScore]}>
              {replay.playerTotalScore}
            </Text>
          </View>
          <Text style={styles.vsText}>{resultEmoji}</Text>
          <View style={styles.scorePlayer}>
            <Text style={styles.scoreLabel}>{replay.opponentName}</Text>
            <Text style={[styles.scoreValue, replay.winner === "opponent" && styles.winnerScore]}>
              {replay.opponentTotalScore}
            </Text>
          </View>
        </View>

        {/* View Mode Tabs */}
        <View style={styles.tabs}>
          {(["playback", "highlights", "stats"] as ViewMode[]).map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.tab, viewMode === mode && styles.activeTab]}
              onPress={() => setViewMode(mode)}
            >
              <Text style={[styles.tabText, viewMode === mode && styles.activeTabText]}>
                {mode === "playback" ? "▶ Play" : mode === "highlights" ? `⭐ ${highlights.length}` : "📊 Stats"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {viewMode === "playback" && currentRound && (
          <View style={styles.playbackContainer}>
            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.roundLabel}>
              Round {playback.currentRound + 1} of {replay.rounds.length}
            </Text>

            {/* Current Word Card */}
            <View style={styles.wordCard}>
              <Text style={styles.wordText}>{currentRound.word}</Text>
              <Text style={styles.phoneticText}>{currentRound.phonetic}</Text>
              <Text style={styles.translationText}>{currentRound.translation}</Text>
            </View>

            {/* Scores */}
            <View style={styles.roundScores}>
              <View style={styles.roundScoreItem}>
                <Text style={styles.roundScoreLabel}>You</Text>
                <Text style={[styles.roundScoreVal, { color: currentRound.playerScore >= currentRound.opponentScore ? Colors.success : Colors.error }]}>
                  {currentRound.playerScore}%
                </Text>
              </View>
              <View style={styles.roundScoreItem}>
                <Text style={styles.roundScoreLabel}>Opponent</Text>
                <Text style={[styles.roundScoreVal, { color: currentRound.opponentScore >= currentRound.playerScore ? Colors.success : Colors.error }]}>
                  {currentRound.opponentScore}%
                </Text>
              </View>
            </View>

            {/* Transcript */}
            {playback.showTranscript && (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>Your pronunciation:</Text>
                <Text style={styles.transcriptText}>"{currentRound.playerTranscript}"</Text>
              </View>
            )}

            {/* Voice Comparison Section */}
            <View style={styles.voiceCompareSection}>
              <View style={styles.voiceCompareHeader}>
                <Ionicons name="ear-outline" size={18} color={Colors.accentBlue} />
                <Text style={styles.voiceCompareTitle}>Voice Compare</Text>
              </View>
              <View style={styles.voiceCompareRow}>
                <TouchableOpacity
                  style={[styles.voiceBtn, isSpeakingNative && styles.voiceBtnActive]}
                  onPress={() => {
                    if (isSpeakingNative) {
                      Speech.stop();
                      setIsSpeakingNative(false);
                    } else {
                      // Map language to BCP 47 code
                      const langMap: Record<string, string> = {
                        Spanish: "es-ES", French: "fr-FR", Portuguese: "pt-BR",
                        Japanese: "ja-JP", German: "de-DE", Korean: "ko-KR",
                        Mandarin: "zh-CN",
                      };
                      const langCode = langMap[replay.language] || "en-US";
                      setIsSpeakingNative(true);
                      Speech.speak(currentRound.word, {
                        language: langCode,
                        rate: 0.8,
                        onDone: () => setIsSpeakingNative(false),
                        onStopped: () => setIsSpeakingNative(false),
                        onError: () => setIsSpeakingNative(false),
                      });
                    }
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  {isSpeakingNative ? (
                    <ActivityIndicator size="small" color={Colors.accentBlue} />
                  ) : (
                    <Ionicons name="volume-high" size={20} color={Colors.accentBlue} />
                  )}
                  <Text style={styles.voiceBtnText}>Native</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.voiceBtn, isSpeakingUser && styles.voiceBtnActive]}
                  onPress={() => {
                    if (isSpeakingUser) {
                      Speech.stop();
                      setIsSpeakingUser(false);
                    } else {
                      setIsSpeakingUser(true);
                      // Speak the user's transcript in English to simulate their pronunciation
                      Speech.speak(currentRound.playerTranscript || currentRound.word, {
                        language: "en-US",
                        rate: 0.9,
                        onDone: () => setIsSpeakingUser(false),
                        onStopped: () => setIsSpeakingUser(false),
                        onError: () => setIsSpeakingUser(false),
                      });
                    }
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  {isSpeakingUser ? (
                    <ActivityIndicator size="small" color="#FF6B00" />
                  ) : (
                    <Ionicons name="person" size={20} color="#FF6B00" />
                  )}
                  <Text style={[styles.voiceBtnText, { color: "#FF6B00" }]}>Yours</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.voiceBtn, voiceCompareMode && styles.voiceBtnActive]}
                  onPress={() => {
                    if (voiceCompareMode) {
                      Speech.stop();
                      setVoiceCompareMode(false);
                      setIsSpeakingNative(false);
                      setIsSpeakingUser(false);
                    } else {
                      setVoiceCompareMode(true);
                      const langMap: Record<string, string> = {
                        Spanish: "es-ES", French: "fr-FR", Portuguese: "pt-BR",
                        Japanese: "ja-JP", German: "de-DE", Korean: "ko-KR",
                        Mandarin: "zh-CN",
                      };
                      const langCode = langMap[replay.language] || "en-US";
                      // Play native first, then user's version
                      setIsSpeakingNative(true);
                      Speech.speak(currentRound.word, {
                        language: langCode,
                        rate: 0.8,
                        onDone: () => {
                          setIsSpeakingNative(false);
                          // Short pause then play user version
                          setTimeout(() => {
                            setIsSpeakingUser(true);
                            Speech.speak(currentRound.playerTranscript || currentRound.word, {
                              language: "en-US",
                              rate: 0.9,
                              onDone: () => { setIsSpeakingUser(false); setVoiceCompareMode(false); },
                              onStopped: () => { setIsSpeakingUser(false); setVoiceCompareMode(false); },
                              onError: () => { setIsSpeakingUser(false); setVoiceCompareMode(false); },
                            });
                          }, 500);
                        },
                        onStopped: () => { setIsSpeakingNative(false); setVoiceCompareMode(false); },
                        onError: () => { setIsSpeakingNative(false); setVoiceCompareMode(false); },
                      });
                    }
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <Ionicons name="swap-horizontal" size={20} color={Colors.success} />
                  <Text style={[styles.voiceBtnText, { color: Colors.success }]}>Compare</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Playback Controls */}
            <View style={styles.controls}>
              <TouchableOpacity onPress={handlePrevRound} style={styles.controlBtn}>
                <Ionicons name="play-skip-back" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleToggleAutoPlay} style={styles.playBtn}>
                <Ionicons
                  name={isAutoPlaying ? "pause" : "play"}
                  size={32}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextRound} style={styles.controlBtn}>
                <Ionicons name="play-skip-forward" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSpeedChange} style={styles.speedBtn}>
                <Text style={styles.speedText}>{playback.speed}x</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {viewMode === "highlights" && (
          <FlatList
            data={highlights}
            keyExtractor={(item, idx) => `${item.replayId}_${item.roundNumber}_${idx}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyHighlights}>
                <Ionicons name="star-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No highlights detected</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.highlightCard}
                onPress={() => handleJumpToRound(item.roundNumber - 1)}
              >
                <View style={styles.highlightIcon}>
                  <Text style={styles.highlightEmoji}>
                    {item.type === "perfect_score" ? "🎯" : item.type === "comeback" ? "🔥" : item.type === "close_call" ? "😰" : item.type === "domination" ? "💪" : "👅"}
                  </Text>
                </View>
                <View style={styles.highlightInfo}>
                  <Text style={styles.highlightTitle}>Round {item.roundNumber}</Text>
                  <Text style={styles.highlightDesc}>{item.description}</Text>
                </View>
                <Ionicons name="play-circle" size={24} color={Colors.primary} />
              </TouchableOpacity>
            )}
          />
        )}

        {viewMode === "stats" && (
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Duration</Text>
              <Text style={styles.statValue}>{Math.round(replay.totalDurationMs / 1000)}s</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Avg Score</Text>
              <Text style={styles.statValue}>
                {Math.round(replay.playerTotalScore / replay.rounds.length)}%
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Best Round</Text>
              <Text style={styles.statValue}>
                {Math.max(...replay.rounds.map(r => r.playerScore))}%
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Rounds Won</Text>
              <Text style={styles.statValue}>
                {replay.rounds.filter(r => r.playerScore > r.opponentScore).length}/{replay.rounds.length}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Highlights</Text>
              <Text style={styles.statValue}>{highlights.length}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Difficulty</Text>
              <Text style={styles.statValue}>{replay.difficulty}</Text>
            </View>

            {/* Share Options */}
            <Text style={styles.shareTitle}>Share Replay</Text>
            <View style={styles.shareOptions}>
              <TouchableOpacity style={styles.shareOption} onPress={() => handleShare("story")}>
                <Ionicons name="image-outline" size={20} color={Colors.primary} />
                <Text style={styles.shareOptionText}>Story</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareOption} onPress={() => handleShare("clip")}>
                <Ionicons name="videocam-outline" size={20} color={Colors.primary} />
                <Text style={styles.shareOptionText}>Clip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareOption} onPress={() => handleShare("full_replay")}>
                <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                <Text style={styles.shareOptionText}>Full</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  shareBtn: { padding: 8 },
  scoreBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    gap: 20,
  },
  scorePlayer: { alignItems: "center" },
  scoreLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  scoreValue: { fontSize: 28, fontWeight: "800", color: Colors.textPrimary },
  winnerScore: { color: Colors.success },
  vsText: { fontSize: 24 },
  tabs: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: BorderRadius.sm },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textMuted },
  activeTabText: { color: "#fff" },
  playbackContainer: { flex: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 2 },
  roundLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: "center", marginTop: 6 },
  wordCard: {
    alignItems: "center",
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  wordText: { fontSize: 28, fontWeight: "800", color: Colors.textPrimary },
  phoneticText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: 4 },
  translationText: { fontSize: FontSize.sm, color: Colors.primary, marginTop: 4 },
  roundScores: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Spacing.md,
  },
  roundScoreItem: { alignItems: "center" },
  roundScoreLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  roundScoreVal: { fontSize: 24, fontWeight: "800" },
  transcriptBox: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  transcriptLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  transcriptText: { fontSize: FontSize.md, color: Colors.textPrimary, marginTop: 4, fontStyle: "italic" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
    gap: 16,
  },
  controlBtn: { padding: 12 },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  speedBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.sm,
  },
  speedText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.primary },
  listContent: { padding: Spacing.md, gap: 10 },
  emptyHighlights: { alignItems: "center", paddingTop: 40, gap: 12 },
  highlightCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 12,
  },
  highlightIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  highlightEmoji: { fontSize: 24 },
  highlightInfo: { flex: 1 },
  highlightTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  highlightDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  statsContainer: { padding: Spacing.md, gap: 12 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  statLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  statValue: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  shareTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginTop: Spacing.md },
  shareOptions: { flexDirection: "row", gap: 12 },
  shareOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
  },
  shareOptionText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.primary },

  // Voice comparison styles
  voiceCompareSection: {
    marginTop: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  voiceCompareHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm,
  },
  voiceCompareTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.accentBlue,
  },
  voiceCompareRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  voiceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  voiceBtnActive: {
    backgroundColor: "rgba(0,204,255,0.1)",
    borderColor: Colors.accentBlue,
  },
  voiceBtnText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.accentBlue,
  },
});
