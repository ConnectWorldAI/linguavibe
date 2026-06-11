/**
 * Share Translated Lyrics as Stories Screen
 * 
 * Export song translations as shareable Instagram story-style cards.
 * Users can customize the visual style and share to social media.
 */
import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  ScrollView, Dimensions, TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 64;
const CARD_HEIGHT = CARD_WIDTH * 1.6;

type LyricCard = {
  id: string;
  originalLine: string;
  translatedLine: string;
  songTitle: string;
  artist: string;
};

type CardStyle = {
  id: string;
  name: string;
  bgGradient: [string, string];
  textColor: string;
  accentColor: string;
};

const CARD_STYLES: CardStyle[] = [
  { id: "midnight", name: "Midnight", bgGradient: ["#0D1B2A", "#1B2838"], textColor: "#ECEDEE", accentColor: "#00AAFF" },
  { id: "sunset", name: "Sunset", bgGradient: ["#FF6B35", "#FF9800"], textColor: "#FFF", accentColor: "#FFE082" },
  { id: "ocean", name: "Ocean", bgGradient: ["#006064", "#00BCD4"], textColor: "#FFF", accentColor: "#B2EBF2" },
  { id: "purple", name: "Purple", bgGradient: ["#4A148C", "#9C27B0"], textColor: "#FFF", accentColor: "#CE93D8" },
  { id: "forest", name: "Forest", bgGradient: ["#1B5E20", "#4CAF50"], textColor: "#FFF", accentColor: "#A5D6A7" },
  { id: "noir", name: "Noir", bgGradient: ["#000000", "#212121"], textColor: "#FFF", accentColor: "#9E9E9E" },
];

const SAMPLE_LYRICS: LyricCard[] = [
  { id: "1", originalLine: "Nobody else can make me feel this way", translatedLine: "Nadie más me puede hacer sentir así", songTitle: "Nobody Else", artist: "Artist" },
  { id: "2", originalLine: "I only want to have you close", translatedLine: "Solo quiero tenerte cerca", songTitle: "Nobody Else", artist: "Artist" },
  { id: "3", originalLine: "And in your ears search for your love", translatedLine: "Y en tus oídos buscar tu amor", songTitle: "Nobody Else", artist: "Artist" },
  { id: "4", originalLine: "I don't want anyone else, I don't need anyone else", translatedLine: "No quiero a nadie más, no necesito a nadie más", songTitle: "Nobody Else", artist: "Artist" },
];

export default function ShareLyricsStoriesScreen() {
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>(CARD_STYLES[0]);
  const [selectedLyric, setSelectedLyric] = useState<LyricCard>(SAMPLE_LYRICS[0]);
  const [customOriginal, setCustomOriginal] = useState("");
  const [customTranslated, setCustomTranslated] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handleShare = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In production, this would use expo-sharing or ViewShot to capture and share
    Alert.alert("Share", "Story card ready to share! In the full app, this would open the system share sheet.");
  };

  const handleSaveToGallery = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Saved", "Story card saved to your gallery!");
  };

  const activeLyric = showCustom
    ? { id: "custom", originalLine: customOriginal || "Your lyrics here", translatedLine: customTranslated || "Tu traducción aquí", songTitle: "Custom", artist: "" }
    : selectedLyric;

  return (
    <ScreenContainer>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#ECEDEE" />
          </TouchableOpacity>
          <Text style={s.title}>Lyric Stories</Text>
          <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
            <Ionicons name="share-outline" size={22} color="#00AAFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Story Card Preview */}
          <View style={[s.storyCard, { backgroundColor: selectedStyle.bgGradient[0] }]}>
            <View style={s.cardInner}>
              {/* App branding */}
              <View style={s.brandRow}>
                <View style={s.brandDot} />
                <Text style={[s.brandText, { color: selectedStyle.accentColor }]}>LinguaVibe</Text>
              </View>

              {/* Lyrics */}
              <View style={s.lyricsSection}>
                <Text style={[s.translatedLyric, { color: selectedStyle.textColor }]}>
                  "{activeLyric.translatedLine}"
                </Text>
                <View style={[s.divider, { backgroundColor: selectedStyle.accentColor }]} />
                <Text style={[s.originalLyric, { color: selectedStyle.accentColor }]}>
                  "{activeLyric.originalLine}"
                </Text>
              </View>

              {/* Song info */}
              <View style={s.songInfo}>
                <Ionicons name="musical-note" size={14} color={selectedStyle.accentColor} />
                <Text style={[s.songTitle, { color: selectedStyle.textColor + "99" }]}>
                  {activeLyric.songTitle} {activeLyric.artist ? `• ${activeLyric.artist}` : ""}
                </Text>
              </View>
            </View>
          </View>

          {/* Style picker */}
          <Text style={s.sectionTitle}>Style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.styleRow}>
            {CARD_STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                onPress={() => { setSelectedStyle(style); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[s.stylePill, selectedStyle.id === style.id && s.stylePillActive]}
              >
                <View style={[s.styleColor, { backgroundColor: style.bgGradient[0] }]} />
                <Text style={[s.styleName, selectedStyle.id === style.id && { color: "#00AAFF" }]}>{style.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Lyric picker */}
          <View style={s.lyricPickerHeader}>
            <Text style={s.sectionTitle}>Lyric</Text>
            <TouchableOpacity onPress={() => setShowCustom(!showCustom)}>
              <Text style={s.customToggle}>{showCustom ? "Use Saved" : "Custom"}</Text>
            </TouchableOpacity>
          </View>

          {showCustom ? (
            <View style={s.customInputs}>
              <TextInput
                style={s.customInput}
                placeholder="Original lyric..."
                placeholderTextColor="#687076"
                value={customOriginal}
                onChangeText={setCustomOriginal}
                multiline
              />
              <TextInput
                style={s.customInput}
                placeholder="Translated lyric..."
                placeholderTextColor="#687076"
                value={customTranslated}
                onChangeText={setCustomTranslated}
                multiline
              />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.lyricRow}>
              {SAMPLE_LYRICS.map((lyric) => (
                <TouchableOpacity
                  key={lyric.id}
                  onPress={() => setSelectedLyric(lyric)}
                  style={[s.lyricChip, selectedLyric.id === lyric.id && s.lyricChipActive]}
                >
                  <Text style={s.lyricChipText} numberOfLines={2}>"{lyric.translatedLine}"</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Action buttons */}
          <View style={s.actions}>
            <TouchableOpacity onPress={handleSaveToGallery} style={s.saveBtn}>
              <Ionicons name="download-outline" size={20} color="#ECEDEE" />
              <Text style={s.saveBtnText}>Save to Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={s.shareActionBtn}>
              <Ionicons name="share-social" size={20} color="#FFF" />
              <Text style={s.shareActionText}>Share Story</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const Alert = {
  alert: (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
    }
  },
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: "#ECEDEE" },
  shareBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 16, paddingBottom: 100, alignItems: "center" },
  storyCard: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 20, overflow: "hidden", marginBottom: 24 },
  cardInner: { flex: 1, padding: 24, justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#00AAFF" },
  brandText: { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  lyricsSection: { flex: 1, justifyContent: "center", alignItems: "center" },
  translatedLyric: { fontSize: 22, fontWeight: "700", textAlign: "center", lineHeight: 30, marginBottom: 16 },
  divider: { width: 40, height: 2, borderRadius: 1, marginBottom: 16 },
  originalLyric: { fontSize: 14, fontStyle: "italic", textAlign: "center", lineHeight: 20 },
  songInfo: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center" },
  songTitle: { fontSize: 11 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#ECEDEE", marginBottom: 10, alignSelf: "flex-start" },
  styleRow: { gap: 10, paddingBottom: 20 },
  stylePill: { alignItems: "center", gap: 4, padding: 8, borderRadius: 10, backgroundColor: "#141825" },
  stylePillActive: { borderWidth: 1, borderColor: "#00AAFF" },
  styleColor: { width: 32, height: 32, borderRadius: 16 },
  styleName: { fontSize: 10, color: "#9BA1A6" },
  lyricPickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 10 },
  customToggle: { fontSize: 13, color: "#00AAFF", fontWeight: "600" },
  customInputs: { width: "100%", gap: 10, marginBottom: 20 },
  customInput: { backgroundColor: "#141825", borderRadius: 10, padding: 14, fontSize: 14, color: "#ECEDEE", minHeight: 50 },
  lyricRow: { gap: 10, paddingBottom: 20 },
  lyricChip: { width: 160, backgroundColor: "#141825", borderRadius: 10, padding: 12 },
  lyricChipActive: { borderWidth: 1, borderColor: "#00AAFF" },
  lyricChipText: { fontSize: 12, color: "#ECEDEE", fontStyle: "italic" },
  actions: { flexDirection: "row", gap: 12, width: "100%", marginTop: 8 },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1C2235", borderRadius: 12, paddingVertical: 14 },
  saveBtnText: { fontSize: 14, fontWeight: "600", color: "#ECEDEE" },
  shareActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#00AAFF", borderRadius: 12, paddingVertical: 14 },
  shareActionText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
