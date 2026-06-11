import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getTasteProfile, saveTasteProfile, type TasteProfile, type ArtistEntry, type SongEntry } from "@/lib/taste-profile";
import { trpc } from "@/lib/trpc";

const GENRES = ["Hip-Hop", "R&B", "Pop", "Reggaeton", "Rock", "Electronic", "Jazz", "Latin", "Afrobeats", "Country", "Indie", "K-Pop", "Classical", "Metal"];
const MOODS = ["Energetic", "Chill", "Dark", "Happy", "Melancholic", "Aggressive", "Romantic", "Dreamy", "Uplifting", "Mysterious"];
const TEMPOS = ["Slow (60-80 BPM)", "Medium (80-110 BPM)", "Upbeat (110-130 BPM)", "Fast (130-160 BPM)", "Very Fast (160+ BPM)"];
const VOCALS = ["Male", "Female", "Autotune", "Raw/Natural", "Raspy", "Smooth", "High-pitched", "Deep/Bass"];
const LANGUAGES = ["Spanish", "French", "Japanese", "Mandarin", "Portuguese", "German", "Italian", "Korean", "Arabic", "Hindi"];
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export default function MusicTasteOnboarding() {
  const router = useRouter();
  const colors = useColors();
  const [step, setStep] = useState(0);
  const [artistInput, setArtistInput] = useState("");
  const [songInput, setSongInput] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedTempos, setSelectedTempos] = useState<string[]>([]);
  const [selectedVocals, setSelectedVocals] = useState<string[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [songs, setSongs] = useState<string[]>([]);
  const [targetLang, setTargetLang] = useState("Spanish");
  const [level, setLevel] = useState<typeof LEVELS[number]>("beginner");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMutation = trpc.tasteIntelligence.analyzeMusicDNA.useMutation();

  useEffect(() => {
    getTasteProfile().then((p) => {
      if (p.topArtists.length > 0) setArtists(p.topArtists.map(a => a.name));
      if (p.topSongs.length > 0) setSongs(p.topSongs.map(s => `${s.title} - ${s.artist}`));
      if (p.preferredGenres.length > 0) setSelectedGenres(p.preferredGenres);
      if (p.preferredMoods.length > 0) setSelectedMoods(p.preferredMoods);
      if (p.preferredTempos.length > 0) setSelectedTempos(p.preferredTempos);
      if (p.vocalPreferences.length > 0) setSelectedVocals(p.vocalPreferences);
      if (p.targetLanguage) setTargetLang(p.targetLanguage.charAt(0).toUpperCase() + p.targetLanguage.slice(1));
      if (p.currentLevel) setLevel(p.currentLevel);
    });
  }, []);

  const addArtist = () => { if (artistInput.trim() && artists.length < 10) { setArtists([...artists, artistInput.trim()]); setArtistInput(""); } };
  const addSong = () => { if (songInput.trim() && songs.length < 10) { setSongs([...songs, songInput.trim()]); setSongInput(""); } };
  const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => { if (list.includes(item)) setter(list.filter(i => i !== item)); else setter([...list, item]); };

  const saveAndFinish = async () => {
    setIsAnalyzing(true);
    try {
      let analysis: any = null;
      if (artists.length > 0) {
        const res = await analyzeMutation.mutateAsync({ artists, songs: songs.map(s => s.split(" - ")[0]) });
        if (res.success) analysis = res.analysis;
      }
      const updatedProfile: TasteProfile = {
        topArtists: artists.map((name): ArtistEntry => ({ name, genre: analysis?.genres?.[0] || selectedGenres[0] || "unknown", addedAt: new Date().toISOString(), playCount: 1, source: "onboarding" })),
        topSongs: songs.map((s): SongEntry => { const parts = s.split(" - "); return { title: parts[0] || s, artist: parts[1] || "Unknown", genre: selectedGenres[0] || "unknown", mood: selectedMoods[0] || "unknown", addedAt: new Date().toISOString(), source: "onboarding" }; }),
        preferredGenres: selectedGenres.length > 0 ? selectedGenres : (analysis?.genres || []),
        preferredMoods: selectedMoods.length > 0 ? selectedMoods : (analysis?.moods || []),
        preferredTempos: selectedTempos.length > 0 ? selectedTempos : (analysis?.recommendedTempos || []),
        vocalPreferences: selectedVocals.length > 0 ? selectedVocals : (analysis?.vocalStyles || []),
        targetLanguage: targetLang.toLowerCase(),
        currentLevel: level,
        activitySignals: [],
        dataCollectionConsent: true,
        onboardingComplete: true,
        lastUpdated: new Date().toISOString(),
      };
      await saveTasteProfile(updatedProfile);
      Alert.alert("Profile Saved!", "Your music taste profile is ready. We'll personalize your learning songs.", [{ text: "Let's Go!", onPress: () => router.back() }]);
    } catch {
      const fallback: TasteProfile = {
        topArtists: artists.map((name): ArtistEntry => ({ name, genre: selectedGenres[0] || "unknown", addedAt: new Date().toISOString(), playCount: 1, source: "onboarding" })),
        topSongs: songs.map((s): SongEntry => { const parts = s.split(" - "); return { title: parts[0] || s, artist: parts[1] || "Unknown", genre: selectedGenres[0] || "unknown", mood: selectedMoods[0] || "unknown", addedAt: new Date().toISOString(), source: "onboarding" }; }),
        preferredGenres: selectedGenres, preferredMoods: selectedMoods, preferredTempos: selectedTempos, vocalPreferences: selectedVocals,
        targetLanguage: targetLang.toLowerCase(), currentLevel: level, activitySignals: [], dataCollectionConsent: true, onboardingComplete: true, lastUpdated: new Date().toISOString(),
      };
      await saveTasteProfile(fallback);
      Alert.alert("Profile Saved!", "Your music taste profile is ready.", [{ text: "OK", onPress: () => router.back() }]);
    } finally { setIsAnalyzing(false); }
  };

  const renderChips = (items: string[], selected: string[], setter: (v: string[]) => void, single?: boolean) => (
    <View style={styles.chipContainer}>
      {items.map(item => (
        <TouchableOpacity key={item} style={[styles.chip, { backgroundColor: selected.includes(item) ? colors.primary : colors.surface, borderColor: selected.includes(item) ? colors.primary : colors.border }]} onPress={() => single ? setter([item]) : toggleItem(item, selected, setter)}>
          <Text style={[styles.chipText, { color: selected.includes(item) ? "#fff" : colors.foreground }]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <View style={styles.stepContainer}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>Your Top Artists</Text>
          <Text style={[styles.stepDesc, { color: colors.muted }]}>Add up to 10 artists you love. We will match their vibe in your learning songs.</Text>
          <View style={styles.inputRow}>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} placeholder="Artist name..." placeholderTextColor={colors.muted} value={artistInput} onChangeText={setArtistInput} onSubmitEditing={addArtist} returnKeyType="done" />
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={addArtist}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>{artists.map((a, i) => (<TouchableOpacity key={i} style={[styles.chip, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]} onPress={() => setArtists(artists.filter((_, idx) => idx !== i))}><Text style={[styles.chipText, { color: colors.primary }]}>{a} x</Text></TouchableOpacity>))}</View>
          <Text style={[styles.counter, { color: colors.muted }]}>{artists.length}/10 artists</Text>
        </View>
      );
      case 1: return (
        <View style={styles.stepContainer}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>Your Top Songs</Text>
          <Text style={[styles.stepDesc, { color: colors.muted }]}>Add songs you are vibing with. Format: Song Title - Artist</Text>
          <View style={styles.inputRow}>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} placeholder="Song - Artist..." placeholderTextColor={colors.muted} value={songInput} onChangeText={setSongInput} onSubmitEditing={addSong} returnKeyType="done" />
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={addSong}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>{songs.map((s, i) => (<TouchableOpacity key={i} style={[styles.chip, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]} onPress={() => setSongs(songs.filter((_, idx) => idx !== i))}><Text style={[styles.chipText, { color: colors.primary }]}>{s} x</Text></TouchableOpacity>))}</View>
          <Text style={[styles.counter, { color: colors.muted }]}>{songs.length}/10 songs</Text>
        </View>
      );
      case 2: return (
        <View style={styles.stepContainer}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>Preferred Genres</Text>
          <Text style={[styles.stepDesc, { color: colors.muted }]}>Select all genres you enjoy.</Text>
          {renderChips(GENRES, selectedGenres, setSelectedGenres)}
        </View>
      );
      case 3: return (
        <View style={styles.stepContainer}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>Moods and Energy</Text>
          <Text style={[styles.stepDesc, { color: colors.muted }]}>What moods do you vibe with?</Text>
          {renderChips(MOODS, selectedMoods, setSelectedMoods)}
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Tempo</Text>
          {renderChips(TEMPOS, selectedTempos, setSelectedTempos)}
        </View>
      );
      case 4: return (
        <View style={styles.stepContainer}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>Vocal Style and Language</Text>
          <Text style={[styles.stepDesc, { color: colors.muted }]}>What vocal styles do you prefer?</Text>
          {renderChips(VOCALS, selectedVocals, setSelectedVocals)}
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Learning Language</Text>
          {renderChips(LANGUAGES, [targetLang], (v) => setTargetLang(v[0] || "Spanish"), true)}
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Your Level</Text>
          {renderChips(LEVELS.map(l => l.charAt(0).toUpperCase() + l.slice(1)), [level.charAt(0).toUpperCase() + level.slice(1)], (v) => setLevel((v[0]?.toLowerCase() || "beginner") as any), true)}
        </View>
      );
      default: return null;
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Music Taste Profile</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Step {step + 1} of 5</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 5) * 100}%`, backgroundColor: colors.primary }]} />
        </View>
        {renderStep()}
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step > 0 && (<TouchableOpacity style={[styles.navBtn, { borderColor: colors.border }]} onPress={() => setStep(step - 1)}><Text style={[styles.navBtnText, { color: colors.foreground }]}>Back</Text></TouchableOpacity>)}
        <TouchableOpacity style={[styles.navBtn, styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={step === 4 ? saveAndFinish : () => setStep(step + 1)} disabled={isAnalyzing}>
          <Text style={styles.primaryBtnText}>{isAnalyzing ? "Analyzing..." : step === 4 ? "Save Profile" : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 4 },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 24 },
  progressFill: { height: 4, borderRadius: 2 },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  stepDesc: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  subTitle: { fontSize: 16, fontWeight: "600", marginTop: 20, marginBottom: 8 },
  inputRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  input: { flex: 1, height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 15 },
  addBtn: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  addBtnText: { color: "#fff", fontSize: 24, fontWeight: "600" },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "500" },
  counter: { marginTop: 12, fontSize: 13 },
  footer: { flexDirection: "row", gap: 12, paddingTop: 12, borderTopWidth: 0.5, position: "absolute", bottom: 40, left: 16, right: 16 },
  navBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  navBtnText: { fontSize: 16, fontWeight: "600" },
  primaryBtn: { borderWidth: 0 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
