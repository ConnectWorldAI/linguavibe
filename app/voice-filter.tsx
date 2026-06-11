import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const ACCENT_FILTERS = [
  {
    id: "dr",
    accent: "Dominican Spanish",
    flag: "🇩🇴",
    sample: "¿Qué lo que, manito?",
    description: "Fast-paced, dropped letters, unique rhythm",
    popular: true,
  },
  {
    id: "mx",
    accent: "Mexican Spanish",
    flag: "🇲🇽",
    sample: "¿Qué onda, güey?",
    description: "Melodic, clear pronunciation, distinct slang",
    popular: true,
  },
  {
    id: "fr",
    accent: "Parisian French",
    flag: "🇫🇷",
    sample: "Bonjour, comment ça va?",
    description: "Elegant, nasal tones, romantic flow",
    popular: true,
  },
  {
    id: "jp",
    accent: "Tokyo Japanese",
    flag: "🇯🇵",
    sample: "こんにちは、元気ですか？",
    description: "Polite, precise, rhythmic patterns",
    popular: false,
  },
  {
    id: "br",
    accent: "Brazilian Portuguese",
    flag: "🇧🇷",
    sample: "E aí, tudo bem?",
    description: "Musical, open vowels, warm tone",
    popular: true,
  },
  {
    id: "uk",
    accent: "British English",
    flag: "🇬🇧",
    sample: "Alright, mate? How's it going?",
    description: "Received pronunciation, crisp consonants",
    popular: false,
  },
  {
    id: "ng",
    accent: "Nigerian Pidgin",
    flag: "🇳🇬",
    sample: "How you dey? Wetin dey happen?",
    description: "Rhythmic, tonal, expressive",
    popular: false,
  },
  {
    id: "kr",
    accent: "Seoul Korean",
    flag: "🇰🇷",
    sample: "안녕하세요, 잘 지내세요?",
    description: "Polite formal, modern casual switch",
    popular: false,
  },
  {
    id: "col",
    accent: "Colombian Spanish",
    flag: "🇨🇴",
    sample: "¿Qué más, parcero?",
    description: "Clear, friendly, sing-song quality",
    popular: false,
  },
  {
    id: "ar",
    accent: "Egyptian Arabic",
    flag: "🇪🇬",
    sample: "إزيك؟ عامل إيه؟",
    description: "Warm, expressive, guttural sounds",
    popular: false,
  },
];

export default function VoiceFilterScreen() {
  const [recording, setRecording] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [hasRecording, setHasRecording] = useState(false);

  const handleRecord = () => {
    if (recording) {
      setRecording(false);
      setHasRecording(true);
    } else {
      setRecording(true);
      setHasRecording(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Filters</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Record Section */}
        <View style={styles.recordSection}>
          <Text style={styles.recordTitle}>
            {recording ? "Recording..." : hasRecording ? "Ready to Transform!" : "Say Something in English"}
          </Text>
          <Text style={styles.recordSubtitle}>
            {recording
              ? "Speak clearly into your microphone"
              : hasRecording
              ? "Choose an accent filter below to hear yourself"
              : "Record yourself, then hear it in any accent"}
          </Text>

          {/* Waveform Visualization */}
          <View style={styles.waveformContainer}>
            {recording ? (
              <View style={styles.waveform}>
                {[...Array(20)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      { height: 10 + Math.random() * 40, backgroundColor: Colors.error },
                    ]}
                  />
                ))}
              </View>
            ) : hasRecording ? (
              <View style={styles.waveform}>
                {[...Array(20)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      { height: 10 + Math.sin(i * 0.5) * 25 + 15, backgroundColor: Colors.success },
                    ]}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.waveform}>
                {[...Array(20)].map((_, i) => (
                  <View
                    key={i}
                    style={[styles.waveBar, { height: 8, backgroundColor: Colors.border }]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Record Button */}
          <TouchableOpacity
            style={[styles.recordButton, recording && styles.recordButtonActive]}
            onPress={handleRecord}
          >
            <Ionicons
              name={recording ? "stop" : "mic"}
              size={32}
              color={recording ? Colors.error : Colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.recordHint}>
            {recording ? "Tap to stop" : "Tap to record"}
          </Text>
        </View>

        {/* Filter Selection */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Choose Your Accent</Text>
          <Text style={styles.sectionSubtitle}>
            Hear yourself speaking in a different language and accent
          </Text>

          {/* Popular Filters */}
          <Text style={styles.filterCategory}>🔥 Popular</Text>
          {ACCENT_FILTERS.filter(f => f.popular).map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterCard,
                selectedFilter === filter.id && styles.filterCardSelected,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={styles.filterFlag}>{filter.flag}</Text>
              <View style={styles.filterInfo}>
                <Text style={styles.filterAccent}>{filter.accent}</Text>
                <Text style={styles.filterSample}>"{filter.sample}"</Text>
                <Text style={styles.filterDescription}>{filter.description}</Text>
              </View>
              {selectedFilter === filter.id ? (
                <View style={styles.filterPlayButton}>
                  <Ionicons name="play" size={16} color={Colors.textPrimary} />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}

          {/* All Filters */}
          <Text style={styles.filterCategory}>🌍 All Accents</Text>
          {ACCENT_FILTERS.filter(f => !f.popular).map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterCard,
                selectedFilter === filter.id && styles.filterCardSelected,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={styles.filterFlag}>{filter.flag}</Text>
              <View style={styles.filterInfo}>
                <Text style={styles.filterAccent}>{filter.accent}</Text>
                <Text style={styles.filterSample}>"{filter.sample}"</Text>
                <Text style={styles.filterDescription}>{filter.description}</Text>
              </View>
              {selectedFilter === filter.id ? (
                <View style={styles.filterPlayButton}>
                  <Ionicons name="play" size={16} color={Colors.textPrimary} />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Share CTA */}
        {hasRecording && selectedFilter && (
          <View style={styles.shareCta}>
            <Text style={styles.shareCtaTitle}>Share Your Voice!</Text>
            <Text style={styles.shareCtaSubtitle}>
              Post your accent transformation to TikTok or Instagram
            </Text>
            <View style={styles.shareButtons}>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="logo-tiktok" size={20} color={Colors.textPrimary} />
                <Text style={styles.shareButtonText}>TikTok</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="logo-instagram" size={20} color={Colors.textPrimary} />
                <Text style={styles.shareButtonText}>Instagram</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-social" size={20} color={Colors.textPrimary} />
                <Text style={styles.shareButtonText}>More</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  recordSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  recordTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  recordSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  waveformContainer: {
    width: "100%",
    height: 60,
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: 60,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  recordButtonActive: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + "15",
  },
  recordHint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  filterSection: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  filterCategory: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  filterCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  filterCardSelected: {
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  filterFlag: {
    fontSize: 28,
  },
  filterInfo: {
    flex: 1,
  },
  filterAccent: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  filterSample: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    marginTop: 2,
    fontStyle: "italic",
  },
  filterDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  shareCta: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  shareCtaTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  shareCtaSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  shareButtons: {
    flexDirection: "row",
    gap: 12,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  shareButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
});
