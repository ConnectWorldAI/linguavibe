import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getTasteProfile, buildTasteSummary, type TasteProfile } from "@/lib/taste-profile";
import { trpc } from "@/lib/trpc";

interface SongConcept {
  title: string;
  suno_prompt: string;
  lyrics_prompt: string;
  style_tags: string[];
  teaching_focus: string;
  estimated_tempo: string;
  mood: string;
}

export default function MyMusicFeed() {
  const router = useRouter();
  const colors = useColors();
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [songs, setSongs] = useState<SongConcept[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [lyrics, setLyrics] = useState<Record<number, string>>({});
  const [lyricsLoading, setLyricsLoading] = useState<number | null>(null);

  const generateMutation = trpc.tasteIntelligence.generatePersonalizedPrompts.useMutation();
  const lyricsMutation = trpc.tasteIntelligence.generateLyrics.useMutation();

  useEffect(() => {
    getTasteProfile().then((p) => {
      setProfile(p);
      if (p.onboardingComplete) generateSongs(p);
    });
  }, []);

  const generateSongs = async (p: TasteProfile) => {
    setLoading(true);
    setError("");
    try {
      const summary = buildTasteSummary(p);
      const res = await generateMutation.mutateAsync({
        tasteSummary: summary,
        targetLanguage: p.targetLanguage,
        level: p.currentLevel,
        count: 5,
      });
      if (res.success && res.songs.length > 0) {
        setSongs(res.songs);
      } else {
        setError("Could not generate songs. Try updating your taste profile.");
      }
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadLyrics = async (idx: number, song: SongConcept) => {
    if (lyrics[idx]) { setExpandedIdx(expandedIdx === idx ? null : idx); return; }
    setLyricsLoading(idx);
    setExpandedIdx(idx);
    try {
      const summary = buildTasteSummary(profile!);
      const res = await lyricsMutation.mutateAsync({
        tasteSummary: summary,
        targetLanguage: profile!.targetLanguage,
        level: profile!.currentLevel,
        songConcept: `${song.title} - ${song.suno_prompt}`,
        teachingFocus: song.teaching_focus,
      });
      setLyrics({ ...lyrics, [idx]: res.lyrics });
    } catch {
      setLyrics({ ...lyrics, [idx]: "Failed to generate lyrics." });
    } finally {
      setLyricsLoading(null);
    }
  };

  const moodColors: Record<string, string> = { energetic: "#FF6B35", chill: "#4ECDC4", dark: "#2C3E50", happy: "#F7DC6F", melancholic: "#8E44AD", romantic: "#E74C3C", dreamy: "#85C1E9", uplifting: "#27AE60" };

  const renderSong = ({ item, index }: { item: SongConcept; index: number }) => {
    const moodColor = moodColors[item.mood?.toLowerCase()] || colors.primary;
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.cardHeader} onPress={() => loadLyrics(index, item)}>
          <View style={[styles.moodDot, { backgroundColor: moodColor }]} />
          <View style={styles.cardContent}>
            <Text style={[styles.songTitle, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.songMeta, { color: colors.muted }]}>{item.mood} | {item.estimated_tempo} | {item.teaching_focus}</Text>
            <View style={styles.tagRow}>
              {item.style_tags?.slice(0, 3).map((tag, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: moodColor + "20" }]}>
                  <Text style={[styles.tagText, { color: moodColor }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={[styles.expandIcon, { color: colors.muted }]}>{expandedIdx === index ? "^" : "v"}</Text>
        </TouchableOpacity>
        {expandedIdx === index && (
          <View style={[styles.lyricsSection, { borderTopColor: colors.border }]}>
            {lyricsLoading === index ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
            ) : lyrics[index] ? (
              <Text style={[styles.lyricsText, { color: colors.foreground }]}>{lyrics[index]}</Text>
            ) : null}
            <Text style={[styles.sunoPrompt, { color: colors.muted }]}>Suno prompt: {item.suno_prompt}</Text>
          </View>
        )}
      </View>
    );
  };

  if (!profile?.onboardingComplete) {
    return (
      <ScreenContainer className="p-6">
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Set Up Your Music Profile</Text>
          <Text style={[styles.emptyDesc, { color: colors.muted }]}>Complete the music taste onboarding to get personalized learning songs that match your vibe.</Text>
          <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/music-taste-onboarding")}>
            <Text style={styles.ctaBtnText}>Set Up Profile</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Music Feed</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>AI-generated songs matching your vibe in {profile.targetLanguage}</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Generating personalized songs...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyDesc, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: colors.primary }]} onPress={() => generateSongs(profile)}>
            <Text style={styles.ctaBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={songs}
          renderItem={renderSong}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListFooterComponent={
            <TouchableOpacity style={[styles.refreshBtn, { borderColor: colors.primary }]} onPress={() => generateSongs(profile)}>
              <Text style={[styles.refreshBtnText, { color: colors.primary }]}>Generate More Songs</Text>
            </TouchableOpacity>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 14 },
  moodDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  cardContent: { flex: 1 },
  songTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  songMeta: { fontSize: 12, marginBottom: 6 },
  tagRow: { flexDirection: "row", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: "500" },
  expandIcon: { fontSize: 16, fontWeight: "600" },
  lyricsSection: { padding: 14, borderTopWidth: 0.5 },
  lyricsText: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  sunoPrompt: { fontSize: 11, fontStyle: "italic" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  ctaBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  refreshBtn: { alignSelf: "center", marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5 },
  refreshBtnText: { fontSize: 14, fontWeight: "600" },
});
