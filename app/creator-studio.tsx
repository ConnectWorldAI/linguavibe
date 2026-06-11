import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const CONTENT_TYPES = [
  {
    id: "video",
    icon: "videocam" as const,
    title: "Video Content",
    desc: "YouTube, TikTok, Reels, Shorts",
    color: "#FF4444",
    features: ["Subtitle translation", "Voiceover in 60+ languages", "Keep your voice tone"],
  },
  {
    id: "song",
    icon: "musical-notes" as const,
    title: "Music & Songs",
    desc: "Lyrics, vocals, full tracks",
    color: "#9B59B6",
    features: ["Lyric translation", "Sing in any language", "Maintain melody & flow"],
  },
  {
    id: "social",
    icon: "share-social" as const,
    title: "Social Media",
    desc: "Captions, posts, stories, threads",
    color: "#00AAFF",
    features: ["Caption translation", "Hashtag localization", "Cultural adaptation"],
  },
  {
    id: "podcast",
    icon: "headset" as const,
    title: "Podcasts & Audio",
    desc: "Episodes, interviews, audiobooks",
    color: "#F39C12",
    features: ["Full episode translation", "Voice cloning", "Multi-speaker support"],
  },
  {
    id: "business",
    icon: "briefcase" as const,
    title: "Business Content",
    desc: "Presentations, ads, marketing",
    color: "#27AE60",
    features: ["Marketing copy translation", "Ad localization", "Brand voice consistency"],
  },
  {
    id: "education",
    icon: "school" as const,
    title: "Educational Content",
    desc: "Courses, tutorials, webinars",
    color: "#FFB800",
    features: ["Course translation", "Quiz localization", "Instructor voice clone"],
  },
];

const LANGUAGES_PREVIEW = [
  { flag: "🇪🇸", name: "Spanish" },
  { flag: "🇫🇷", name: "French" },
  { flag: "🇩🇪", name: "German" },
  { flag: "🇯🇵", name: "Japanese" },
  { flag: "🇰🇷", name: "Korean" },
  { flag: "🇧🇷", name: "Portuguese" },
  { flag: "🇨🇳", name: "Chinese" },
  { flag: "🇸🇦", name: "Arabic" },
];

const STATS = [
  { value: "60+", label: "Languages" },
  { value: "10x", label: "Reach" },
  { value: "98%", label: "Accuracy" },
  { value: "24hr", label: "Turnaround" },
];

export default function CreatorStudioScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSelectType = (id: string) => {
    setSelectedType(id === selectedType ? null : id);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleGetStarted = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Navigate to Creator Upload wizard
    router.push("/creator-upload" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Studio</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="rocket" size={36} color={Colors.gold} />
          </View>
          <Text style={styles.heroTitle}>Reach the World</Text>
          <Text style={styles.heroSubtitle}>
            Translate your content into 60+ languages. Grow your audience globally — 
            whether you're an artist, podcaster, educator, or business.
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Content Types */}
        <Text style={styles.sectionTitle}>What do you create?</Text>
        <Text style={styles.sectionSubtitle}>Select your content type to see what we can do for you</Text>

        <View style={styles.contentGrid}>
          {CONTENT_TYPES.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.contentCard,
                  isSelected && { borderColor: type.color, backgroundColor: type.color + "15" },
                ]}
                onPress={() => handleSelectType(type.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.contentIconWrap, { backgroundColor: type.color + "20" }]}>
                  <Ionicons name={type.icon} size={24} color={type.color} />
                </View>
                <Text style={styles.contentTitle}>{type.title}</Text>
                <Text style={styles.contentDesc}>{type.desc}</Text>
                {isSelected && (
                  <View style={styles.featuresBox}>
                    {type.features.map((f, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={14} color={type.color} />
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Languages Preview */}
        <Text style={styles.sectionTitle}>Translate into any language</Text>
        <View style={styles.languagesRow}>
          {LANGUAGES_PREVIEW.map((lang) => (
            <View key={lang.name} style={styles.langChip}>
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={styles.langName}>{lang.name}</Text>
            </View>
          ))}
          <View style={styles.langChipMore}>
            <Text style={styles.langMoreText}>+52 more</Text>
          </View>
        </View>

        {/* Value Proposition */}
        <View style={styles.valueCard}>
          <Ionicons name="trending-up" size={28} color={Colors.gold} />
          <Text style={styles.valueTitle}>Why creators use ConnectWorld AI</Text>
          <View style={styles.valueList}>
            <View style={styles.valueItem}>
              <Ionicons name="globe" size={16} color={Colors.secondary} />
              <Text style={styles.valueText}>Reach international audiences without learning new languages</Text>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="people" size={16} color={Colors.secondary} />
              <Text style={styles.valueText}>Gain supporters, clients, and customers worldwide</Text>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="mic" size={16} color={Colors.secondary} />
              <Text style={styles.valueText}>Your voice, your tone — just in a different language</Text>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="flash" size={16} color={Colors.secondary} />
              <Text style={styles.valueText}>Fast turnaround — translate entire videos in hours, not weeks</Text>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="cash" size={16} color={Colors.secondary} />
              <Text style={styles.valueText}>Monetize content in new markets without extra production</Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, !selectedType && styles.ctaBtnDisabled]}
          onPress={handleGetStarted}
          activeOpacity={0.8}
          disabled={!selectedType}
        >
          <Ionicons name="arrow-forward-circle" size={22} color="#FFFFFF" />
          <Text style={styles.ctaBtnText}>
            {selectedType ? "Get Started" : "Select a content type above"}
          </Text>
        </TouchableOpacity>

        {/* Already have content? */}
        <View style={styles.existingContentCard}>
          <Ionicons name="cloud-upload" size={24} color={Colors.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.existingTitle}>Already have content?</Text>
            <Text style={styles.existingDesc}>
              Upload your video, song, or audio file directly and we'll translate it for you
            </Text>
          </View>
          <TouchableOpacity
            style={styles.uploadSmallBtn}
            onPress={() => router.push("/creator-upload" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.uploadSmallBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 60 },

  // Hero
  heroSection: { alignItems: "center", paddingTop: 12, marginBottom: 24 },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.goldGlow, alignItems: "center", justifyContent: "center",
    marginBottom: 16, borderWidth: 1, borderColor: Colors.goldBorder,
  },
  heroTitle: { fontSize: 26, fontWeight: "800", color: Colors.textPrimary, marginBottom: 8 },
  heroSubtitle: {
    fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center", lineHeight: 22,
  },

  // Stats
  statsRow: {
    flexDirection: "row", justifyContent: "space-around",
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg,
    padding: 16, marginBottom: 28, borderWidth: 1, borderColor: Colors.glowBorder,
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: Colors.secondary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Sections
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  sectionSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 16 },

  // Content Grid
  contentGrid: { gap: 12, marginBottom: 28 },
  contentCard: {
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  contentIconWrap: {
    width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  contentTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  contentDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  featuresBox: { marginTop: 12, gap: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  featureText: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Languages
  languagesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  langChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.surfaceCard, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  langFlag: { fontSize: 14 },
  langName: { fontSize: FontSize.xs, color: Colors.textSecondary },
  langChipMore: {
    backgroundColor: Colors.secondary + "20", paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  langMoreText: { fontSize: FontSize.xs, color: Colors.secondary, fontWeight: "600" },

  // Value Card
  valueCard: {
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.xl, padding: 20,
    marginBottom: 24, borderWidth: 1, borderColor: Colors.goldBorder,
  },
  valueTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginTop: 12, marginBottom: 14 },
  valueList: { gap: 10 },
  valueItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  valueText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, lineHeight: 20 },

  // CTA
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.secondary, paddingVertical: 16, borderRadius: BorderRadius.xl,
    marginBottom: 16,
  },
  ctaBtnDisabled: { backgroundColor: "rgba(0,170,255,0.3)" },
  ctaBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#FFFFFF" },

  // Existing Content
  existingContentCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: 16,
    borderWidth: 1, borderColor: "rgba(0,170,255,0.2)", marginBottom: 20,
  },
  existingTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  existingDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  uploadSmallBtn: {
    backgroundColor: Colors.secondary, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  uploadSmallBtnText: { fontSize: FontSize.xs, fontWeight: "700", color: "#FFFFFF" },
});
