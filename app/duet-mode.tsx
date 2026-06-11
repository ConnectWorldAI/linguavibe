import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type DuetPartner = {
  id: string;
  name: string;
  avatar: string;
  flag: string;
  language: string;
  level: string;
  online: boolean;
  matchScore: number;
};

type DuetSong = {
  id: string;
  title: string;
  artist: string;
  language: string;
  difficulty: "Easy" | "Medium" | "Hard";
  duration: string;
  coverEmoji: string;
};

const PARTNERS: DuetPartner[] = [
  { id: "1", name: "Maria Garcia", avatar: "👩🏽", flag: "🇲🇽", language: "Spanish", level: "B2", online: true, matchScore: 95 },
  { id: "2", name: "Yuki Tanaka", avatar: "👩🏻", flag: "🇯🇵", language: "Japanese", level: "B1", online: true, matchScore: 88 },
  { id: "3", name: "Pierre Dupont", avatar: "👨🏻", flag: "🇫🇷", language: "French", level: "A2", online: false, matchScore: 82 },
  { id: "4", name: "Amara Okafor", avatar: "👩🏿", flag: "🇳🇬", language: "Yoruba", level: "C1", online: true, matchScore: 76 },
];

const DUET_SONGS: DuetSong[] = [
  { id: "1", title: "Despacito", artist: "Luis Fonsi", language: "Spanish", difficulty: "Easy", duration: "3:47", coverEmoji: "🎶" },
  { id: "2", title: "La Vie en Rose", artist: "Edith Piaf", language: "French", difficulty: "Medium", duration: "3:22", coverEmoji: "🌹" },
  { id: "3", title: "Sukiyaki", artist: "Kyu Sakamoto", language: "Japanese", difficulty: "Hard", duration: "3:05", coverEmoji: "🌸" },
  { id: "4", title: "Bésame Mucho", artist: "Consuelo Velázquez", language: "Spanish", difficulty: "Easy", duration: "3:15", coverEmoji: "💋" },
  { id: "5", title: "Non, je ne regrette rien", artist: "Edith Piaf", language: "French", difficulty: "Hard", duration: "2:19", coverEmoji: "🇫🇷" },
  { id: "6", title: "Ojitos Lindos", artist: "Bad Bunny", language: "Spanish", difficulty: "Medium", duration: "4:18", coverEmoji: "👀" },
];

export default function DuetModeScreen() {
  const colors = useColors();
  const [step, setStep] = useState<"select_partner" | "select_song" | "performing">("select_partner");
  const [selectedPartner, setSelectedPartner] = useState<DuetPartner | null>(null);
  const [selectedSong, setSelectedSong] = useState<DuetSong | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [score, setScore] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const LYRICS = [
    { line: "Despacito, quiero respirar tu cuello despacito", role: "you", translation: "Slowly, I want to breathe your neck slowly" },
    { line: "Deja que te diga cosas al oído", role: "partner", translation: "Let me whisper things in your ear" },
    { line: "Para que te acuerdes si no estás conmigo", role: "you", translation: "So you remember when you're not with me" },
    { line: "Despacito, quiero desnudarte a besos despacito", role: "partner", translation: "Slowly, I want to undress you with kisses slowly" },
    { line: "Firmar las paredes de tu laberinto", role: "you", translation: "Sign the walls of your labyrinth" },
    { line: "Y hacer de tu cuerpo todo un manuscrito", role: "both", translation: "And make your body a whole manuscript" },
  ];

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setCurrentLine((prev) => {
          if (prev >= LYRICS.length - 1) {
            setIsRecording(false);
            clearInterval(interval);
            return prev;
          }
          setScore((s) => s + Math.floor(Math.random() * 15) + 80);
          return prev + 1;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startPerformance = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("performing");
    setIsRecording(true);
    setCurrentLine(0);
    setScore(0);
  };

  const renderPartnerSelection = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose a Duet Partner</Text>
      <Text style={[styles.sectionDesc, { color: colors.muted }]}>Sing together in different languages</Text>

      {PARTNERS.map((partner) => (
        <TouchableOpacity
          key={partner.id}
          style={[
            styles.partnerCard,
            { backgroundColor: colors.surface, borderColor: selectedPartner?.id === partner.id ? colors.primary : colors.border },
          ]}
          activeOpacity={0.7}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedPartner(partner);
          }}
        >
          <View style={styles.partnerLeft}>
            <View style={styles.partnerAvatarWrap}>
              <Text style={{ fontSize: 28 }}>{partner.avatar}</Text>
              {partner.online && <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />}
            </View>
            <View>
              <Text style={[styles.partnerName, { color: colors.foreground }]}>{partner.flag} {partner.name}</Text>
              <Text style={[styles.partnerMeta, { color: colors.muted }]}>{partner.language} • Level {partner.level}</Text>
            </View>
          </View>
          <View style={[styles.matchBadge, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.matchText, { color: colors.primary }]}>{partner.matchScore}%</Text>
          </View>
        </TouchableOpacity>
      ))}

      {selectedPartner && (
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          onPress={() => setStep("select_song")}
        >
          <Text style={styles.nextBtnText}>Choose Song</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderSongSelection = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pick a Song</Text>
      <Text style={[styles.sectionDesc, { color: colors.muted }]}>You'll sing your lines, {selectedPartner?.name} sings theirs</Text>

      {DUET_SONGS.map((song) => (
        <TouchableOpacity
          key={song.id}
          style={[
            styles.songCard,
            { backgroundColor: colors.surface, borderColor: selectedSong?.id === song.id ? colors.primary : colors.border },
          ]}
          activeOpacity={0.7}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedSong(song);
          }}
        >
          <Text style={styles.songEmoji}>{song.coverEmoji}</Text>
          <View style={styles.songInfo}>
            <Text style={[styles.songTitle, { color: colors.foreground }]}>{song.title}</Text>
            <Text style={[styles.songArtist, { color: colors.muted }]}>{song.artist} • {song.language}</Text>
          </View>
          <View style={styles.songMeta}>
            <View style={[styles.diffBadge, {
              backgroundColor: song.difficulty === "Easy" ? "#4ADE8020" : song.difficulty === "Medium" ? "#FBBF2420" : "#F8717120",
            }]}>
              <Text style={[styles.diffText, {
                color: song.difficulty === "Easy" ? "#4ADE80" : song.difficulty === "Medium" ? "#FBBF24" : "#F87171",
              }]}>{song.difficulty}</Text>
            </View>
            <Text style={[styles.songDuration, { color: colors.muted }]}>{song.duration}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {selectedSong && (
        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={startPerformance}>
          <Ionicons name="mic" size={18} color="#FFF" />
          <Text style={styles.nextBtnText}>Start Duet</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderPerformance = () => (
    <View style={styles.performanceContainer}>
      {/* Duet Header */}
      <View style={[styles.duetHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.duetPartners}>
          <View style={styles.duetPerson}>
            <Text style={{ fontSize: 24 }}>🎤</Text>
            <Text style={[styles.duetPersonName, { color: colors.foreground }]}>You</Text>
          </View>
          <View style={[styles.vsCircle, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.vsText, { color: colors.primary }]}>♪</Text>
          </View>
          <View style={styles.duetPerson}>
            <Text style={{ fontSize: 24 }}>{selectedPartner?.avatar}</Text>
            <Text style={[styles.duetPersonName, { color: colors.foreground }]}>{selectedPartner?.name?.split(" ")[0]}</Text>
          </View>
        </View>
        <Text style={[styles.songPlaying, { color: colors.muted }]}>{selectedSong?.title} - {selectedSong?.artist}</Text>
      </View>

      {/* Lyrics Display */}
      <ScrollView contentContainerStyle={styles.lyricsContainer}>
        {LYRICS.map((lyric, index) => (
          <View
            key={index}
            style={[
              styles.lyricLine,
              {
                backgroundColor: index === currentLine ? (lyric.role === "you" ? colors.primary + "15" : "#A855F715") : "transparent",
                borderLeftColor: lyric.role === "you" ? colors.primary : lyric.role === "partner" ? "#A855F7" : colors.success,
                opacity: index < currentLine ? 0.5 : 1,
              },
            ]}
          >
            <View style={styles.lyricHeader}>
              <Text style={[styles.lyricRole, {
                color: lyric.role === "you" ? colors.primary : lyric.role === "partner" ? "#A855F7" : colors.success,
              }]}>
                {lyric.role === "you" ? "🎤 Your Turn" : lyric.role === "partner" ? `${selectedPartner?.avatar} ${selectedPartner?.name?.split(" ")[0]}` : "🎵 Together"}
              </Text>
              {index === currentLine && isRecording && (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <View style={[styles.liveDot, { backgroundColor: "#F87171" }]} />
                </Animated.View>
              )}
            </View>
            <Text style={[styles.lyricText, { color: colors.foreground }]}>{lyric.line}</Text>
            <Text style={[styles.lyricTranslation, { color: colors.muted }]}>{lyric.translation}</Text>
            {index < currentLine && (
              <View style={styles.scoreRow}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={[styles.lineScore, { color: "#FBBF24" }]}>{Math.floor(Math.random() * 15) + 80}%</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Score Footer */}
      <View style={[styles.scoreFooter, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.scoreInfo}>
          <Text style={[styles.scoreLabel, { color: colors.muted }]}>Combined Score</Text>
          <Text style={[styles.scoreValue, { color: colors.primary }]}>{currentLine > 0 ? Math.floor(score / currentLine) : 0}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${((currentLine + 1) / LYRICS.length) * 100}%` }]} />
        </View>
        {!isRecording && currentLine >= LYRICS.length - 1 && (
          <TouchableOpacity style={[styles.finishBtn, { backgroundColor: colors.success }]} onPress={() => router.back()}>
            <Text style={styles.finishBtnText}>Finish Duet</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Duet Mode</Text>
        <View style={{ width: 32 }} />
      </View>

      {step === "select_partner" && renderPartnerSelection()}
      {step === "select_song" && renderSongSelection()}
      {step === "performing" && renderPerformance()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { padding: 16 },
  sectionTitle: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  sectionDesc: { fontSize: 13, marginBottom: 16 },
  partnerCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 10 },
  partnerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  partnerAvatarWrap: { position: "relative" },
  onlineDot: { position: "absolute", bottom: 0, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: "#151718" },
  partnerName: { fontSize: 15, fontWeight: "700" },
  partnerMeta: { fontSize: 12, marginTop: 2 },
  matchBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  matchText: { fontSize: 12, fontWeight: "800" },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  nextBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  songCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 10, gap: 12 },
  songEmoji: { fontSize: 28 },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 14, fontWeight: "700" },
  songArtist: { fontSize: 12, marginTop: 2 },
  songMeta: { alignItems: "flex-end", gap: 4 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 10, fontWeight: "700" },
  songDuration: { fontSize: 11 },
  performanceContainer: { flex: 1 },
  duetHeader: { padding: 16, borderBottomWidth: 0.5, alignItems: "center" },
  duetPartners: { flexDirection: "row", alignItems: "center", gap: 16 },
  duetPerson: { alignItems: "center", gap: 4 },
  duetPersonName: { fontSize: 12, fontWeight: "600" },
  vsCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  vsText: { fontSize: 16, fontWeight: "800" },
  songPlaying: { fontSize: 11, marginTop: 8 },
  lyricsContainer: { padding: 16, paddingBottom: 120 },
  lyricLine: { padding: 14, borderRadius: 12, marginBottom: 10, borderLeftWidth: 3 },
  lyricHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  lyricRole: { fontSize: 11, fontWeight: "700" },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  lyricText: { fontSize: 16, fontWeight: "600", lineHeight: 22 },
  lyricTranslation: { fontSize: 12, marginTop: 4, fontStyle: "italic" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  lineScore: { fontSize: 11, fontWeight: "700" },
  scoreFooter: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 0.5 },
  scoreInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  scoreLabel: { fontSize: 12 },
  scoreValue: { fontSize: 18, fontWeight: "800" },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: "rgba(128,128,128,0.2)", marginBottom: 12 },
  progressFill: { height: 4, borderRadius: 2 },
  finishBtn: { paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  finishBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
});
