/**
 * Tutorials Screen — WaveLoud-guided step-by-step walkthroughs
 * 
 * Covers:
 * 1. How to translate a song (full pipeline)
 * 2. How to use the stem separator
 * 3. How to generate a lesson from lyrics
 * 4. How to use WaveLoud agent mode
 * 5. How to save and export translated songs
 */

import { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

const Colors = {
  bg: "#0A0E1A",
  surface: "#141825",
  surfaceLight: "#1C2235",
  text: "#FFFFFF",
  textSecondary: "#A0AEC0",
  textMuted: "#64748B",
  accent: "#00AAFF",
  accentGlow: "rgba(0,170,255,0.08)",
  purple: "#8B5CF6",
  gold: "#FFD700",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "rgba(255,255,255,0.06)",
};

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  waveLoudSays: string;
  action?: { label: string; route: string; params?: Record<string, string> };
}

interface Tutorial {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  steps: TutorialStep[];
  category: "song" | "lesson" | "agent" | "library";
}

const TUTORIALS: Tutorial[] = [
  {
    id: "translate-song",
    title: "Translate a Song",
    subtitle: "Turn any song into your target language while keeping the rhythm and melody",
    icon: "musical-notes",
    iconColor: Colors.accent,
    duration: "3 min",
    difficulty: "Beginner",
    category: "song",
    steps: [
      {
        id: 1,
        title: "Choose Your Song",
        description: "Paste a song URL (Spotify, YouTube, Apple Music) or enter the song title and artist manually.",
        icon: "link",
        waveLoudSays: "Hey! Just paste any song link or type the name. I'll find it for you. Works with Bad Bunny, Drake, BTS — anything!",
      },
      {
        id: 2,
        title: "Select Target Language",
        description: "Pick the language you want the song translated into. We support 15+ languages with dialect options.",
        icon: "language",
        waveLoudSays: "Pick your language! Want Dominican Spanish? Mexican? We got all the flavors. The AI will match the syllable count so it still flows.",
      },
      {
        id: 3,
        title: "Choose Voice Style",
        description: "Match Original keeps the artist's vocal tone. Natural AI uses a clean voice. My Voice (Pro) clones your voice.",
        icon: "mic",
        waveLoudSays: "Match Original is fire — it keeps Bad Bunny sounding like Bad Bunny, just in English. Or go Pro and hear YOUR voice singing it!",
      },
      {
        id: 4,
        title: "Hit Translate (or Let Me Do It)",
        description: "Press 'WaveLoud: Do Everything' and I'll handle the entire pipeline automatically — stem separation, transcription, translation, vocal synthesis, and mixing.",
        icon: "flash",
        waveLoudSays: "Just hit my button and sit back. I'll split the vocals, transcribe the lyrics, translate them keeping the rhythm, re-sing them in the new language, and mix it all back together. One button. Done.",
        action: { label: "Try It Now", route: "/song-translate-agent" },
      },
      {
        id: 5,
        title: "Listen & Save",
        description: "Preview your translated song with synced lyrics. Save to your library, download the file, or share it with friends.",
        icon: "checkmark-circle",
        waveLoudSays: "Boom! Your translated song is ready. Save it to your library, download the MP3, or share it. You can also start a lesson from the lyrics to learn the vocabulary!",
      },
    ],
  },
  {
    id: "stem-separator",
    title: "Split Song into Stems",
    subtitle: "Isolate vocals, instrumentals, drums, and bass from any track",
    icon: "git-branch",
    iconColor: Colors.purple,
    duration: "2 min",
    difficulty: "Beginner",
    category: "song",
    steps: [
      {
        id: 1,
        title: "Upload Your Audio",
        description: "Tap the cloud upload button to pick an MP3, WAV, M4A, or FLAC file from your device.",
        icon: "cloud-upload",
        waveLoudSays: "Upload any audio file — MP3, WAV, whatever you got. I'll split it into separate tracks for you.",
      },
      {
        id: 2,
        title: "AI Separates the Stems",
        description: "The AI analyzes the audio and separates it into vocals, instrumental, drums, and bass tracks.",
        icon: "analytics",
        waveLoudSays: "I'm using AI to pull apart every layer of the song. Vocals go one way, beats go another. Like magic.",
      },
      {
        id: 3,
        title: "Mix & Match",
        description: "Use the sliders to control each stem's volume. Solo the vocals to hear lyrics clearly, or mute them for karaoke mode.",
        icon: "options",
        waveLoudSays: "Now you're the DJ! Slide the vocals up to hear every word, or kill them for karaoke mode. Mix it however you want.",
        action: { label: "Open Stem Separator", route: "/stem-separator", params: { title: "Demo Song", artist: "Demo" } },
      },
      {
        id: 4,
        title: "Extract Lyrics & Generate Lesson",
        description: "The AI transcribes the lyrics from the isolated vocals. Then you can generate a full grammar/vocabulary lesson from them.",
        icon: "school",
        waveLoudSays: "Once I have the clean vocals, I transcribe every word. Then I break it down — vocabulary, grammar, slang, conjugations. It's a full lesson from one song!",
      },
    ],
  },
  {
    id: "lesson-from-song",
    title: "Learn from Song Lyrics",
    subtitle: "Turn any song into a vocabulary, grammar, and cultural lesson",
    icon: "school",
    iconColor: Colors.gold,
    duration: "2 min",
    difficulty: "Beginner",
    category: "lesson",
    steps: [
      {
        id: 1,
        title: "Get to the Lesson Breakdown",
        description: "From the Song Player, Stem Separator, or Upload Song completion screen, tap 'Start Full Lesson from This Song'.",
        icon: "arrow-forward",
        waveLoudSays: "After you play or translate a song, just hit the lesson button. I'll analyze every line and teach you what it means.",
      },
      {
        id: 2,
        title: "Browse Vocabulary",
        description: "See every word categorized: nouns, verbs, adjectives, idioms, slang. Each word shows pronunciation, gender, conjugation tables, and example sentences.",
        icon: "book",
        waveLoudSays: "I pull out every important word and break it down. Gender, conjugation, pronunciation — the whole thing. Free users get 5 words, Pro gets unlimited.",
      },
      {
        id: 3,
        title: "Study Grammar Rules",
        description: "The AI identifies grammar patterns used in the lyrics and explains them with examples from the song plus additional examples.",
        icon: "document-text",
        waveLoudSays: "See that subjunctive tense Bad Bunny used? I'll explain exactly what it is, why he used it, and give you more examples so you actually learn it.",
      },
      {
        id: 4,
        title: "Take the Quiz",
        description: "Test your knowledge with AI-generated questions about the vocabulary and grammar from the song.",
        icon: "help-circle",
        waveLoudSays: "Ready to test yourself? I'll quiz you on everything from the song. Get them right and you'll remember these words forever!",
        action: { label: "Try Demo Lesson", route: "/song-lesson-breakdown", params: { title: "Fuego en la Calle", artist: "DJ Latino", sourceLanguage: "Spanish", targetLanguage: "English" } },
      },
    ],
  },
  {
    id: "waveloud-agent",
    title: "WaveLoud Agent Mode",
    subtitle: "Let the AI agent handle everything with one button press",
    icon: "flash",
    iconColor: "#7C3AED",
    duration: "1 min",
    difficulty: "Beginner",
    category: "agent",
    steps: [
      {
        id: 1,
        title: "What is WaveLoud?",
        description: "WaveLoud is your AI agent that knows the entire app inside and out. Instead of doing each step manually, WaveLoud does everything for you.",
        icon: "sparkles",
        waveLoudSays: "I'm WaveLoud — your personal AI music translator. Tell me what song you want translated and I'll handle the ENTIRE process. No clicking through menus, no waiting between steps. One button, done.",
      },
      {
        id: 2,
        title: "One-Button Translation",
        description: "On the Song Translation screen, tap 'WaveLoud: Do Everything'. The agent automatically: separates stems, transcribes lyrics, translates preserving rhythm, synthesizes new vocals, and mixes the final track.",
        icon: "rocket",
        waveLoudSays: "Here's the deal: you give me a song, I split it, transcribe it, translate it keeping the flow, re-sing it in your language, mix it back together, and deliver it. All you do is press ONE button.",
      },
      {
        id: 3,
        title: "Auto-Save & Lesson",
        description: "When WaveLoud finishes, it automatically saves to your library and offers to generate a lesson. You can also download or share immediately.",
        icon: "bookmark",
        waveLoudSays: "When I'm done, everything's saved to your library. Want a lesson from it? I'll generate that too. Download, share, whatever you need — I got you.",
        action: { label: "Try WaveLoud", route: "/song-translate-agent" },
      },
    ],
  },
  {
    id: "save-library",
    title: "Save & Manage Your Library",
    subtitle: "Build your collection of translated songs and track your progress",
    icon: "library",
    iconColor: Colors.success,
    duration: "1 min",
    difficulty: "Beginner",
    category: "library",
    steps: [
      {
        id: 1,
        title: "Save to My Library",
        description: "After any translation completes, tap the bookmark icon or 'Save to My Library' button. The song is stored with all metadata.",
        icon: "bookmark",
        waveLoudSays: "Hit that bookmark and the song's yours forever. I save the title, artist, language, quality scores — everything.",
      },
      {
        id: 2,
        title: "Track Lesson Completion",
        description: "When you complete a lesson from a song, it's marked with a green checkmark in your library. Track which songs you've fully learned.",
        icon: "checkmark-circle",
        waveLoudSays: "Every song you learn from gets a checkmark. Build up your collection and watch your vocabulary grow song by song!",
      },
      {
        id: 3,
        title: "Download & Share",
        description: "Download translated songs as MP3 files to your device. Share them with friends or on social media.",
        icon: "share-social",
        waveLoudSays: "Download your translated songs or share them. Show your friends what Bad Bunny sounds like in English — or what Drake sounds like in Spanish!",
      },
    ],
  },
];

export default function TutorialsScreen() {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [filter, setFilter] = useState<"all" | "song" | "lesson" | "agent" | "library">("all");

  const filteredTutorials = filter === "all" ? TUTORIALS : TUTORIALS.filter((t) => t.category === filter);

  const handleSelectTutorial = useCallback((tutorial: Tutorial) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTutorial(tutorial);
    setCurrentStep(0);
  }, []);

  const handleNextStep = useCallback(() => {
    if (!selectedTutorial) return;
    if (currentStep < selectedTutorial.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [selectedTutorial, currentStep]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [currentStep]);

  const handleTryAction = useCallback((action: { label: string; route: string; params?: Record<string, string> }) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({ pathname: action.route as any, params: action.params } as any);
  }, []);

  // Tutorial detail view
  if (selectedTutorial) {
    const step = selectedTutorial.steps[currentStep];
    const isLastStep = currentStep === selectedTutorial.steps.length - 1;

    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedTutorial(null)} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{selectedTutorial.title}</Text>
          <Text style={styles.stepCounter}>{currentStep + 1}/{selectedTutorial.steps.length}</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {/* Progress dots */}
          <View style={styles.progressDots}>
            {selectedTutorial.steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentStep && styles.dotActive,
                  i < currentStep && styles.dotComplete,
                ]}
              />
            ))}
          </View>

          {/* Step Content */}
          <Animated.View key={currentStep} entering={FadeIn.duration(300)} style={styles.stepCard}>
            {/* Step Icon */}
            <View style={[styles.stepIconContainer, { backgroundColor: selectedTutorial.iconColor + "15" }]}>
              <Ionicons name={step.icon as any} size={32} color={selectedTutorial.iconColor} />
            </View>

            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>

            {/* WaveLoud Says */}
            <View style={styles.waveLoudBubble}>
              <View style={styles.waveLoudHeader}>
                <Ionicons name="flash" size={14} color="#7C3AED" />
                <Text style={styles.waveLoudName}>WaveLoud says:</Text>
              </View>
              <Text style={styles.waveLoudText}>{step.waveLoudSays}</Text>
            </View>

            {/* Action button if available */}
            {step.action && (
              <TouchableOpacity
                style={styles.tryItButton}
                onPress={() => handleTryAction(step.action!)}
              >
                <Ionicons name="play" size={18} color="#fff" />
                <Text style={styles.tryItText}>{step.action.label}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={[styles.navButton, currentStep === 0 && { opacity: 0.3 }]}
            onPress={handlePrevStep}
            disabled={currentStep === 0}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.text} />
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>

          {isLastStep ? (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setSelectedTutorial(null)}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Tutorial list view
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tutorials</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* WaveLoud Intro */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.introCard}>
        <View style={styles.introIconRow}>
          <View style={styles.introOrb}>
            <Ionicons name="flash" size={24} color="#7C3AED" />
          </View>
          <View style={styles.introTextCol}>
            <Text style={styles.introTitle}>WaveLoud Tutorials</Text>
            <Text style={styles.introSubtitle}>Learn how to use every feature with your AI guide</Text>
          </View>
        </View>
      </Animated.View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {([
          { key: "all", label: "All", icon: "apps" },
          { key: "song", label: "Songs", icon: "musical-notes" },
          { key: "lesson", label: "Lessons", icon: "school" },
          { key: "agent", label: "Agent", icon: "flash" },
          { key: "library", label: "Library", icon: "library" },
        ] as const).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Ionicons name={f.icon as any} size={14} color={filter === f.key ? Colors.accent : Colors.textMuted} />
            <Text style={[styles.filterChipText, filter === f.key && { color: Colors.accent }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tutorial List */}
      <FlatList
        data={filteredTutorials}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 80)}>
            <TouchableOpacity style={styles.tutorialCard} onPress={() => handleSelectTutorial(item)}>
              <View style={[styles.tutorialIcon, { backgroundColor: item.iconColor + "15" }]}>
                <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
              </View>
              <View style={styles.tutorialInfo}>
                <Text style={styles.tutorialTitle}>{item.title}</Text>
                <Text style={styles.tutorialSubtitle} numberOfLines={2}>{item.subtitle}</Text>
                <View style={styles.tutorialMeta}>
                  <View style={styles.metaBadge}>
                    <Ionicons name="time" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{item.duration}</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Ionicons name="bar-chart" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{item.difficulty}</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaText}>{item.steps.length} steps</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600", color: Colors.text, flex: 1, textAlign: "center" },
  stepCounter: { fontSize: 13, fontWeight: "600", color: Colors.accent, width: 40, textAlign: "right" },

  // Intro card
  introCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "rgba(124,58,237,0.2)" },
  introIconRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  introOrb: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(124,58,237,0.15)", alignItems: "center", justifyContent: "center" },
  introTextCol: { flex: 1 },
  introTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  introSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  // Filter
  filterRow: { maxHeight: 44, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  filterChipText: { fontSize: 13, color: Colors.textMuted, fontWeight: "500" },

  // Tutorial list
  listContent: { padding: 16, gap: 12 },
  tutorialCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  tutorialIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tutorialInfo: { flex: 1, gap: 4 },
  tutorialTitle: { fontSize: 15, fontWeight: "600", color: Colors.text },
  tutorialSubtitle: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
  tutorialMeta: { flexDirection: "row", gap: 8, marginTop: 4 },
  metaBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11, color: Colors.textMuted },

  // Step detail
  content: { flex: 1 },
  contentInner: { padding: 20, paddingBottom: 40 },
  progressDots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.1)" },
  dotActive: { backgroundColor: Colors.accent, width: 24 },
  dotComplete: { backgroundColor: Colors.success },

  stepCard: { alignItems: "center", gap: 16 },
  stepIconContainer: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  stepTitle: { fontSize: 20, fontWeight: "700", color: Colors.text, textAlign: "center" },
  stepDescription: { fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22, paddingHorizontal: 8 },

  // WaveLoud bubble
  waveLoudBubble: { backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "rgba(124,58,237,0.2)", width: "100%", marginTop: 8 },
  waveLoudHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  waveLoudName: { fontSize: 12, fontWeight: "700", color: "#7C3AED", textTransform: "uppercase", letterSpacing: 0.5 },
  waveLoudText: { fontSize: 14, color: Colors.text, lineHeight: 20 },

  // Try it button
  tryItButton: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  tryItText: { fontSize: 15, fontWeight: "600", color: "#fff" },

  // Navigation bar
  navBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  navButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8 },
  navButtonText: { fontSize: 15, color: Colors.text },
  nextButton: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  nextButtonText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  doneButton: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.success, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  doneButtonText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
