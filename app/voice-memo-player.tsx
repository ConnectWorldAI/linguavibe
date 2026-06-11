/**
 * Voice Memo Player Screen
 * 
 * Plays a personalized voice memo from the AI teacher.
 * Shows the transcript, tip, and target language phrase.
 * Feels like receiving a voice note from a real teacher.
 */
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { useAudioPlayer, AudioPlayer } from "expo-audio";
import {
  getVoiceMemos,
  markAsRead,
  markAsPlayed,
  deleteMemo,
  type VoiceMemo,
} from "@/lib/voice-memos";
import { trpc } from "@/lib/trpc";

export default function VoiceMemoPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ memoId?: string }>();
  
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<VoiceMemo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const playerRef = useRef<AudioPlayer | null>(null);

  const generateMemoMutation = trpc.teacherVoiceMemo.generateVoiceMemo.useMutation();

  useEffect(() => {
    loadMemos();
    return () => {
      // Cleanup audio player
      if (playerRef.current) {
        playerRef.current.release();
      }
    };
  }, []);

  const loadMemos = async () => {
    try {
      const allMemos = await getVoiceMemos();
      setMemos(allMemos);
      
      // If a specific memo was requested, select it
      if (params.memoId) {
        const target = allMemos.find((m) => m.id === params.memoId);
        if (target) {
          setSelectedMemo(target);
          await markAsRead(target.id);
        }
      } else if (allMemos.length > 0) {
        // Select the first unread, or first memo
        const unread = allMemos.find((m) => !m.isRead);
        setSelectedMemo(unread || allMemos[0]);
      }
    } catch (err) {
      console.warn("Failed to load voice memos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMemo = async (memo: VoiceMemo) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    let audioUrl = memo.audioUrl;

    // On-demand audio generation: if no audio URL, call server to generate it
    if (!audioUrl) {
      try {
        setGenerating(true);
        const result = await generateMemoMutation.mutateAsync({
          transcript: memo.transcript,
          teacherPersona: memo.teacherPersona,
          language: "auto",
          memoType: memo.memoType,
          struggleArea: memo.struggleArea as any,
        });
        audioUrl = (result as any).audioUrl;

        // Cache the generated audio URL locally so it doesn't regenerate next time
        if (audioUrl) {
          const { updateMemoAudioUrl } = await import("@/lib/voice-memos");
          await updateMemoAudioUrl(memo.id, audioUrl);
          // Update local state
          setMemos((prev) => prev.map((m) => m.id === memo.id ? { ...m, audioUrl } : m));
          setSelectedMemo((prev) => prev?.id === memo.id ? { ...prev, audioUrl } : prev);
        }
      } catch (err) {
        console.warn("Failed to generate audio:", err);
        // Fall back to just showing transcript
        await markAsPlayed(memo.id);
        setGenerating(false);
        return;
      } finally {
        setGenerating(false);
      }
    }

    if (!audioUrl) {
      await markAsPlayed(memo.id);
      return;
    }

    try {
      // Release previous player
      if (playerRef.current) {
        playerRef.current.release();
      }

      // Create new player with the memo audio
      const { createAudioPlayer } = require("expo-audio");
      const player = createAudioPlayer({ uri: audioUrl });
      playerRef.current = player;
      
      setIsPlaying(true);
      player.play();
      await markAsPlayed(memo.id);

      // Listen for completion
      const checkInterval = setInterval(() => {
        if (!player.playing) {
          setIsPlaying(false);
          clearInterval(checkInterval);
        }
      }, 500);
    } catch (err) {
      console.warn("Audio playback failed:", err);
      setIsPlaying(false);
    }
  };

  const handleStopPlayback = () => {
    if (playerRef.current) {
      playerRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleDeleteMemo = async (memo: VoiceMemo) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await deleteMemo(memo.id);
    setMemos((prev) => prev.filter((m) => m.id !== memo.id));
    if (selectedMemo?.id === memo.id) {
      setSelectedMemo(null);
    }
  };

  const handleSelectMemo = async (memo: VoiceMemo) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMemo(memo);
    if (!memo.isRead) {
      await markAsRead(memo.id);
      setMemos((prev) => prev.map((m) => m.id === memo.id ? { ...m, isRead: true } : m));
    }
  };

  const getMemoTypeIcon = (type: string) => {
    switch (type) {
      case "encouragement": return "💪";
      case "tip": return "💡";
      case "homework_assigned": return "📚";
      case "milestone": return "🎉";
      case "check_in": return "👋";
      default: return "🎙️";
    }
  };

  const getMemoTypeLabel = (type: string) => {
    switch (type) {
      case "encouragement": return "Encouragement";
      case "tip": return "Teaching Tip";
      case "homework_assigned": return "New Homework";
      case "milestone": return "Milestone!";
      case "check_in": return "Check-in";
      default: return "Voice Memo";
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading voice memos...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <Text style={styles.backBtn}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>🎙️ Teacher Messages</Text>
          <Text style={styles.subtitle}>
            Personalized voice memos from your AI teacher
          </Text>
        </View>

        {/* Selected Memo Player */}
        {selectedMemo && (
          <View style={styles.playerSection}>
            <View style={styles.playerCard}>
              <View style={styles.playerHeader}>
                <Text style={styles.playerIcon}>{getMemoTypeIcon(selectedMemo.memoType)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerTeacher}>{selectedMemo.teacherName}</Text>
                  <Text style={styles.playerType}>{getMemoTypeLabel(selectedMemo.memoType)}</Text>
                </View>
                <Text style={styles.playerDate}>
                  {new Date(selectedMemo.createdAt).toLocaleDateString()}
                </Text>
              </View>

              {/* Play button - generates audio on-demand if not cached */}
              <Pressable
                onPress={() => isPlaying ? handleStopPlayback() : handlePlayMemo(selectedMemo)}
                disabled={generating}
                style={({ pressed }) => [styles.playButton, pressed && { opacity: 0.8 }, generating && { opacity: 0.6 }]}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                ) : (
                  <Text style={styles.playButtonIcon}>{isPlaying ? "⏸" : "▶️"}</Text>
                )}
                <Text style={styles.playButtonText}>
                  {generating ? "Generating audio..." : isPlaying ? "Pause" : selectedMemo.audioUrl ? "Play Voice Memo" : "Generate & Play"}
                </Text>
              </Pressable>

              {/* Transcript */}
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>Transcript</Text>
                <Text style={styles.transcriptText}>{selectedMemo.transcript}</Text>
              </View>

              {/* Target language phrase */}
              {selectedMemo.targetLanguagePhrase && (
                <View style={styles.phraseBox}>
                  <Text style={styles.phraseLabel}>🌍 In your target language:</Text>
                  <Text style={styles.phraseText}>{selectedMemo.targetLanguagePhrase}</Text>
                </View>
              )}

              {/* Tip */}
              {selectedMemo.tip && (
                <View style={styles.tipBox}>
                  <Text style={styles.tipLabel}>💡 Teacher's Tip:</Text>
                  <Text style={styles.tipText}>{selectedMemo.tip}</Text>
                </View>
              )}

              {/* Struggle context */}
              <View style={styles.contextBox}>
                <Text style={styles.contextLabel}>About: {selectedMemo.struggleArea}</Text>
              </View>

              {/* Actions */}
              <View style={styles.memoActions}>
                <Pressable
                  onPress={() => {
                    // Navigate to practice for this struggle area
                    router.push({
                      pathname: "/smart-practice" as any,
                    });
                  }}
                  style={({ pressed }) => [styles.practiceBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.practiceBtnText}>Practice Now</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteMemo(selectedMemo)}
                  style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Memo List */}
        {memos.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>All Messages</Text>
            {memos.map((memo) => (
              <Pressable
                key={memo.id}
                onPress={() => handleSelectMemo(memo)}
                style={({ pressed }) => [
                  styles.memoListItem,
                  !memo.isRead && styles.memoUnread,
                  selectedMemo?.id === memo.id && styles.memoSelected,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.memoListIcon}>{getMemoTypeIcon(memo.memoType)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memoListTitle, !memo.isRead && styles.memoListTitleUnread]}>
                    {memo.teacherName} — {getMemoTypeLabel(memo.memoType)}
                  </Text>
                  <Text style={styles.memoListPreview} numberOfLines={1}>
                    {memo.transcript}
                  </Text>
                  <Text style={styles.memoListDate}>
                    {new Date(memo.createdAt).toLocaleDateString()} • {memo.struggleArea}
                  </Text>
                </View>
                {!memo.isRead && <View style={styles.unreadDot} />}
                {memo.audioUrl && <Text style={styles.audioIcon}>🔊</Text>}
              </Pressable>
            ))}
          </View>
        )}

        {/* Empty state */}
        {memos.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎙️</Text>
            <Text style={styles.emptyTitle}>No Voice Memos Yet</Text>
            <Text style={styles.emptyDesc}>
              When your AI teacher notices you're struggling with something, they'll send you a personalized voice memo with tips and encouragement. Keep practicing!
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 16, color: "#9BA1A6", marginTop: 12 },
  header: { padding: 20, paddingTop: 12 },
  backBtn: { fontSize: 14, color: "#8B5CF6", marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "800", color: "#ECEDEE", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#9BA1A6" },

  // Player
  playerSection: { paddingHorizontal: 20, marginTop: 16 },
  playerCard: { backgroundColor: "#1a1a2e", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#8B5CF6" },
  playerHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  playerIcon: { fontSize: 28, marginRight: 12 },
  playerTeacher: { fontSize: 16, fontWeight: "700", color: "#ECEDEE" },
  playerType: { fontSize: 12, color: "#A78BFA", marginTop: 2 },
  playerDate: { fontSize: 11, color: "#687076" },
  
  playButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#8B5CF6", borderRadius: 12, paddingVertical: 14, marginBottom: 16 },
  playButtonIcon: { fontSize: 20, marginRight: 8 },
  playButtonText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  transcriptBox: { backgroundColor: "rgba(139,92,246,0.08)", borderRadius: 10, padding: 14, marginBottom: 12 },
  transcriptLabel: { fontSize: 11, fontWeight: "600", color: "#A78BFA", marginBottom: 6 },
  transcriptText: { fontSize: 14, color: "#ECEDEE", lineHeight: 22 },

  phraseBox: { backgroundColor: "rgba(0,170,255,0.08)", borderRadius: 10, padding: 14, marginBottom: 12 },
  phraseLabel: { fontSize: 11, fontWeight: "600", color: "#00AAFF", marginBottom: 6 },
  phraseText: { fontSize: 15, color: "#ECEDEE", fontStyle: "italic", lineHeight: 22 },

  tipBox: { backgroundColor: "rgba(245,158,11,0.08)", borderRadius: 10, padding: 14, marginBottom: 12 },
  tipLabel: { fontSize: 11, fontWeight: "600", color: "#F59E0B", marginBottom: 6 },
  tipText: { fontSize: 13, color: "#ECEDEE", lineHeight: 20 },

  contextBox: { marginBottom: 16 },
  contextLabel: { fontSize: 11, color: "#687076" },

  memoActions: { flexDirection: "row", gap: 12 },
  practiceBtn: { flex: 1, backgroundColor: "#8B5CF6", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  practiceBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  deleteBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  deleteBtnText: { fontSize: 13, color: "#EF4444" },

  // List
  listSection: { paddingHorizontal: 20, marginTop: 24 },
  listTitle: { fontSize: 16, fontWeight: "700", color: "#ECEDEE", marginBottom: 12 },
  memoListItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a2234", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#334155" },
  memoUnread: { borderColor: "#8B5CF6", backgroundColor: "#1a1a2e" },
  memoSelected: { borderColor: "#8B5CF6", borderWidth: 2 },
  memoListIcon: { fontSize: 24, marginRight: 12 },
  memoListTitle: { fontSize: 14, fontWeight: "500", color: "#ECEDEE" },
  memoListTitleUnread: { fontWeight: "700" },
  memoListPreview: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  memoListDate: { fontSize: 10, color: "#687076", marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#8B5CF6", marginLeft: 8 },
  audioIcon: { fontSize: 14, marginLeft: 6 },

  // Empty
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#ECEDEE", marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: "#9BA1A6", textAlign: "center", lineHeight: 20 },
});
