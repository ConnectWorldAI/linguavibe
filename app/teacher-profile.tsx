import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { setAudioModeAsync, createAudioPlayer, type AudioPlayer } from "expo-audio";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { getAllTeachers, type Teacher } from "@/lib/teacher-registry";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

type MediaTab = "info" | "photos" | "links" | "audio" | "documents";

export default function TeacherProfileScreen() {
  const { teacherId } = useLocalSearchParams<{ teacherId: string }>();
  const allTeachers = getAllTeachers();
  const teacher = allTeachers.find(t => t.id === teacherId);
  const [activeTab, setActiveTab] = useState<MediaTab>("info");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [playingPhraseIdx, setPlayingPhraseIdx] = useState<number | null>(null);
  const [cachedAudioUrls, setCachedAudioUrls] = useState<Record<string, string>>({});
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ttsMutation = trpc.translate.tts.useMutation();

  useEffect(() => {
    loadFavoriteStatus();
  }, [teacherId]);

  const loadFavoriteStatus = async () => {
    try {
      const favs = await AsyncStorage.getItem("@favorite_teachers");
      if (favs) {
        const parsed = JSON.parse(favs) as string[];
        setIsFavorite(parsed.includes(teacherId || ""));
      }
    } catch {}
  };

  const toggleFavorite = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const favs = await AsyncStorage.getItem("@favorite_teachers");
      let parsed: string[] = favs ? JSON.parse(favs) : [];
      if (isFavorite) {
        parsed = parsed.filter(id => id !== teacherId);
      } else {
        parsed.push(teacherId || "");
      }
      await AsyncStorage.setItem("@favorite_teachers", JSON.stringify(parsed));
      setIsFavorite(!isFavorite);
    } catch {}
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.remove();
        audioPlayerRef.current = null;
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  const stopCurrentAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.remove();
      audioPlayerRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    Speech.stop();
    setIsPlayingVoice(false);
    setPlayingPhraseIdx(null);
  };

  const getTeacherVoiceId = (t: Teacher): string => {
    // Map teacher gender/accent to curated ElevenLabs voices
    const gender = t.gender || "female";
    const dialect = t.dialects[0] || "";
    if (dialect.includes("British") || dialect.includes("Australian") || dialect.includes("South African")) {
      return gender === "male" ? "JBFqnCBsd6RMkjVDRZzb" : "pFZP5JQG7iQjIQuC4Bku"; // George / Lily
    }
    if (gender === "male") return "nPczCjzI2devNBz1zQrb"; // Brian
    return "cgSgspJ2msm6clMCkdW9"; // Jessica
  };

  const playVoiceSample = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlayingVoice) {
      stopCurrentAudio();
      return;
    }
    const phrases = getSamplePhrases(teacher!);
    const sampleText = phrases.map(p => p.text).join(". ");
    await playElevenLabsAudio(sampleText, -1);
  };

  const playPhraseAudio = async (text: string, idx: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playingPhraseIdx === idx) {
      stopCurrentAudio();
      return;
    }
    stopCurrentAudio();
    await playElevenLabsAudio(text, idx);
  };

  const playElevenLabsAudio = async (text: string, phraseIdx: number) => {
    const voiceId = getTeacherVoiceId(teacher!);
    const cacheKey = `${text}_${voiceId}`;

    try {
      await setAudioModeAsync({ playsInSilentMode: true });
    } catch {}

    // Check cache
    const cachedUrl = cachedAudioUrls[cacheKey];
    if (cachedUrl) {
      playFromUrl(cachedUrl, phraseIdx);
      return;
    }

    // Generate with ElevenLabs
    setIsLoadingVoice(true);
    setIsPlayingVoice(true);
    if (phraseIdx >= 0) setPlayingPhraseIdx(phraseIdx);

    try {
      const result = await ttsMutation.mutateAsync({
        text,
        voiceId,
        language: getLanguageCode(teacher!),
      });

      if (result.audioUrl) {
        setCachedAudioUrls(prev => ({ ...prev, [cacheKey]: result.audioUrl }));
        playFromUrl(result.audioUrl, phraseIdx);
      }
    } catch {
      // Fallback to expo-speech
      const langCode = getLanguageCode(teacher!);
      Speech.speak(text, {
        language: langCode,
        rate: 0.85,
        onDone: () => { setIsPlayingVoice(false); setPlayingPhraseIdx(null); },
        onStopped: () => { setIsPlayingVoice(false); setPlayingPhraseIdx(null); },
        onError: () => { setIsPlayingVoice(false); setPlayingPhraseIdx(null); },
      });
    } finally {
      setIsLoadingVoice(false);
    }
  };

  const playFromUrl = (url: string, phraseIdx: number) => {
    try {
      const player = createAudioPlayer(url);
      audioPlayerRef.current = player;
      setIsPlayingVoice(true);
      if (phraseIdx >= 0) setPlayingPhraseIdx(phraseIdx);
      player.play();
      checkIntervalRef.current = setInterval(() => {
        if (!player.playing) {
          setIsPlayingVoice(false);
          setPlayingPhraseIdx(null);
          player.remove();
          audioPlayerRef.current = null;
          if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        }
      }, 400);
    } catch {
      // Fallback
      const langCode = getLanguageCode(teacher!);
      const phrases = getSamplePhrases(teacher!);
      const text = phraseIdx >= 0 ? phrases[phraseIdx]?.text || "" : phrases.map(p => p.text).join(". ");
      Speech.speak(text, {
        language: langCode,
        rate: 0.85,
        onDone: () => { setIsPlayingVoice(false); setPlayingPhraseIdx(null); },
        onStopped: () => { setIsPlayingVoice(false); setPlayingPhraseIdx(null); },
        onError: () => { setIsPlayingVoice(false); setPlayingPhraseIdx(null); },
      });
    }
  };

  if (!teacher) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Teacher Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Teacher not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleStartCall = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/hume-call",
      params: {
        mode: "teacher",
        teacherName: teacher.name,
        language: teacher.dialects[0] || "Spanish",
        dialect: teacher.dialects[0] || "",
        level: "intermediate",
      },
    } as any);
  };

  const handleSelectTeacher = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem("@selected_teacher_id", teacher.id);
    router.back();
  };

  const samplePhrases = getSamplePhrases(teacher);
  const TABS: { key: MediaTab; label: string }[] = [
    { key: "info", label: "Info" },
    { key: "photos", label: "Photos" },
    { key: "links", label: "Links" },
    { key: "audio", label: "Audio" },
    { key: "documents", label: "Docs" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teacher Profile</Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.backBtn}>
          <Ionicons
            name={isFavorite ? "star" : "star-outline"}
            size={24}
            color={isFavorite ? Colors.gold : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image source={{ uri: teacher.photoUrl }} style={styles.avatar} />
          <Text style={styles.teacherName}>{teacher.name}</Text>
          <Text style={styles.teacherOrigin}>{teacher.origin}</Text>

          {/* Quick Action Buttons (iMessage style) */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleStartCall} activeOpacity={0.7}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="call" size={22} color={Colors.secondary} />
              </View>
              <Text style={styles.quickActionLabel}>Audio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleStartCall} activeOpacity={0.7}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="videocam" size={22} color={Colors.secondary} />
              </View>
              <Text style={styles.quickActionLabel}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={playVoiceSample} activeOpacity={0.7}>
              <View style={[styles.quickActionIcon, isPlayingVoice && { backgroundColor: Colors.secondary + "30" }]}>
                {isLoadingVoice && !isPlayingVoice ? (
                  <ActivityIndicator size="small" color={Colors.secondary} />
                ) : (
                  <Ionicons name={isPlayingVoice ? "stop" : "volume-high"} size={22} color={Colors.secondary} />
                )}
              </View>
              <Text style={styles.quickActionLabel}>{isLoadingVoice ? "Loading..." : "Voice"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* iMessage-style Tab Bar */}
        <View style={styles.tabBarContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        {activeTab === "info" && renderInfoTab(teacher, samplePhrases)}
        {activeTab === "photos" && renderPhotosTab()}
        {activeTab === "links" && renderLinksTab()}
        {activeTab === "audio" && renderAudioTab(teacher, playingPhraseIdx, isLoadingVoice, playPhraseAudio)}
        {activeTab === "documents" && renderDocumentsTab()}

        {/* WhatsApp-style Settings Section */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="images" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Media, links and docs</Text>
              <Text style={styles.settingsValue}>{samplePhrases.length} items</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="star" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Starred Messages</Text>
              <Text style={styles.settingsValue}>0</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="search" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Search in Conversation</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.settingsCard, { marginTop: 16 }]}>
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="notifications" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Notifications</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="language" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Transcript Language</Text>
              <Text style={styles.settingsValue}>{teacher.dialects[0] || "Auto"}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="color-palette" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Chat Theme</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.settingsCard, { marginTop: 16 }]}>
            <TouchableOpacity style={styles.settingsRow} onPress={handleSelectTeacher} activeOpacity={0.7}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
              <Text style={[styles.settingsLabel, { color: Colors.secondary }]}>Set as My Teacher</Text>
              <View style={{ flex: 1 }} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="share-social" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Share Teacher</Text>
              <View style={{ flex: 1 }} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="download" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Export Chat</Text>
              <View style={{ flex: 1 }} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Info Tab
function renderInfoTab(teacher: Teacher, samplePhrases: { text: string; translation: string }[]) {
  return (
    <View style={styles.tabContent}>
      {/* About Section */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="sparkles" size={16} color={Colors.secondary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoLabel}>Personality</Text>
            <Text style={styles.infoValue}>{teacher.personality}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="school" size={16} color={Colors.accent} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoLabel}>Teaching Style</Text>
            <Text style={styles.infoValue}>{teacher.style}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="globe" size={16} color={Colors.gold} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoLabel}>Native Languages</Text>
            <Text style={styles.infoValue}>{teacher.nativeLanguages.join(", ")}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="chatbubbles" size={16} color={Colors.success} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoLabel}>Dialect Specializations</Text>
            <Text style={styles.infoValue}>{teacher.dialects.join(", ")}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color={Colors.accent} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoLabel}>Age Range</Text>
            <Text style={styles.infoValue}>{teacher.ageRange}</Text>
          </View>
        </View>
      </View>

      {/* Sample Phrases */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Sample Phrases</Text>
      {samplePhrases.map((phrase, idx) => (
        <View key={idx} style={styles.phraseCard}>
          <Text style={styles.phraseText}>{phrase.text}</Text>
          <Text style={styles.phraseTranslation}>{phrase.translation}</Text>
        </View>
      ))}
    </View>
  );
}

// Photos Tab
function renderPhotosTab() {
  return (
    <View style={styles.tabContent}>
      <View style={styles.emptyTabState}>
        <Ionicons name="images-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyTabTitle}>No Photos Yet</Text>
        <Text style={styles.emptyTabSub}>Photos shared in your conversations with this teacher will appear here</Text>
      </View>
    </View>
  );
}

// Links Tab
function renderLinksTab() {
  return (
    <View style={styles.tabContent}>
      <View style={styles.emptyTabState}>
        <Ionicons name="link-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyTabTitle}>No Links Yet</Text>
        <Text style={styles.emptyTabSub}>Links shared in your conversations will appear here for easy access</Text>
      </View>
    </View>
  );
}

// Audio Tab - now uses ElevenLabs via parent component's playPhraseAudio
function renderAudioTab(teacher: Teacher, playingPhraseIdx: number | null, isLoadingVoice: boolean, onPlayPhrase: (text: string, idx: number) => void) {
  const phrases = getSamplePhrases(teacher);
  return (
    <View style={styles.tabContent}>
      <View style={styles.hdVoiceBadge}>
        <Ionicons name="diamond" size={14} color={Colors.gold} />
        <Text style={styles.hdVoiceText}>HD Voice by ElevenLabs</Text>
      </View>
      <Text style={styles.audioSectionTitle}>Voice Samples</Text>
      <Text style={styles.audioSectionSub}>Tap to hear {teacher.name.split(" ")[0]}'s actual AI voice</Text>
      {phrases.map((phrase, idx) => {
        const isPlaying = playingPhraseIdx === idx;
        return (
          <TouchableOpacity
            key={idx}
            style={[styles.audioItem, isPlaying && styles.audioItemActive]}
            onPress={() => onPlayPhrase(phrase.text, idx)}
            activeOpacity={0.7}
          >
            <View style={[styles.audioPlayBtn, isPlaying && styles.audioPlayBtnActive]}>
              {isLoadingVoice && playingPhraseIdx === idx ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name={isPlaying ? "stop" : "play"} size={16} color="#fff" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.audioItemText}>{phrase.text}</Text>
              <Text style={styles.audioItemSub}>{phrase.translation}</Text>
            </View>
            {isPlaying && (
              <View style={styles.audioWaveform}>
                <View style={[styles.waveBar, { height: 8 }]} />
                <View style={[styles.waveBar, { height: 14 }]} />
                <View style={[styles.waveBar, { height: 10 }]} />
                <View style={[styles.waveBar, { height: 16 }]} />
                <View style={[styles.waveBar, { height: 6 }]} />
              </View>
            )}
            {!isPlaying && <Text style={styles.audioDuration}>0:05</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Documents Tab
function renderDocumentsTab() {
  return (
    <View style={styles.tabContent}>
      <View style={styles.emptyTabState}>
        <Ionicons name="document-text-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyTabTitle}>No Documents Yet</Text>
        <Text style={styles.emptyTabSub}>Lesson notes, vocabulary lists, and documents shared by your teacher will appear here</Text>
      </View>
    </View>
  );
}

// Helper: get language code for TTS
function getLanguageCode(teacher: Teacher): string {
  const dialect = teacher.dialects[0] || "";
  if (dialect.includes("Spanish") || dialect.includes("Dominican") || dialect.includes("Mexican") || dialect.includes("Colombian") || dialect.includes("Puerto Rican") || dialect.includes("Cuban") || dialect.includes("Argentine") || dialect.includes("Venezuelan") || dialect.includes("Peruvian") || dialect.includes("Chilean") || dialect.includes("Honduran") || dialect.includes("Salvadoran")) return "es";
  if (dialect.includes("French") || dialect.includes("Français") || dialect.includes("Haitian") || dialect.includes("Congolese") || dialect.includes("Ivorian")) return "fr";
  if (dialect.includes("Portuguese") || dialect.includes("Brazilian")) return "pt";
  if (dialect.includes("Japanese") || dialect.includes("日本語")) return "ja";
  if (dialect.includes("Korean") || dialect.includes("한국어")) return "ko";
  if (dialect.includes("Arabic") || dialect.includes("العربية") || dialect.includes("Egyptian") || dialect.includes("Levantine") || dialect.includes("Gulf") || dialect.includes("Moroccan")) return "ar";
  if (dialect.includes("Mandarin") || dialect.includes("Cantonese") || dialect.includes("Taiwanese")) return "zh";
  if (dialect.includes("Hindi") || dialect.includes("हिन्दी")) return "hi";
  if (dialect.includes("German") || dialect.includes("Deutsch")) return "de";
  if (dialect.includes("Italian") || dialect.includes("Italiano")) return "it";
  if (dialect.includes("Russian") || dialect.includes("Русский")) return "ru";
  if (dialect.includes("Turkish") || dialect.includes("Türkçe")) return "tr";
  if (dialect.includes("British") || dialect.includes("Australian") || dialect.includes("Nigerian") || dialect.includes("Jamaican") || dialect.includes("Indian") || dialect.includes("South African")) return "en";
  return "en";
}

// Helper to generate sample phrases based on teacher's dialect
function getSamplePhrases(teacher: Teacher): { text: string; translation: string }[] {
  const dialect = teacher.dialects[0] || "";
  
  if (dialect.includes("Dominican")) {
    return [
      { text: "¿Qué lo que, manito?", translation: "What's up, bro?" },
      { text: "Eso ta' to'", translation: "That's all good" },
      { text: "Vamo' a darle", translation: "Let's do it" },
    ];
  } else if (dialect.includes("Mexican")) {
    return [
      { text: "¡Qué onda, güey!", translation: "What's up, dude!" },
      { text: "No manches", translation: "No way / You're kidding" },
      { text: "Está chido", translation: "That's cool" },
    ];
  } else if (dialect.includes("Colombian")) {
    return [
      { text: "¡Qué más, parcero!", translation: "What's up, buddy!" },
      { text: "¡Qué chimba!", translation: "That's awesome!" },
      { text: "A la orden", translation: "At your service" },
    ];
  } else if (dialect.includes("British")) {
    return [
      { text: "Fancy a cuppa?", translation: "Would you like a cup of tea?" },
      { text: "That's brilliant, mate!", translation: "That's great, friend!" },
      { text: "I'm chuffed to bits", translation: "I'm very pleased" },
    ];
  } else if (dialect.includes("Nigerian")) {
    return [
      { text: "How you dey?", translation: "How are you?" },
      { text: "No wahala", translation: "No problem" },
      { text: "E go be", translation: "It will be fine" },
    ];
  } else if (dialect.includes("Jamaican")) {
    return [
      { text: "Wah gwaan?", translation: "What's going on?" },
      { text: "Everyting irie", translation: "Everything is good" },
      { text: "Mi deh yah", translation: "I'm here" },
    ];
  } else if (dialect.includes("French") || dialect.includes("Français")) {
    return [
      { text: "Comment ça va?", translation: "How are you?" },
      { text: "C'est la vie", translation: "That's life" },
      { text: "Enchanté!", translation: "Nice to meet you!" },
    ];
  } else if (dialect.includes("Brazilian") || dialect.includes("Portuguese")) {
    return [
      { text: "E aí, beleza?", translation: "Hey, all good?" },
      { text: "Tudo joia!", translation: "Everything's great!" },
      { text: "Valeu, mano!", translation: "Thanks, bro!" },
    ];
  } else if (dialect.includes("Japanese") || dialect.includes("日本語")) {
    return [
      { text: "お元気ですか？", translation: "How are you?" },
      { text: "頑張りましょう！", translation: "Let's do our best!" },
      { text: "すごいですね！", translation: "That's amazing!" },
    ];
  } else if (dialect.includes("Korean") || dialect.includes("한국어")) {
    return [
      { text: "잘 지내세요?", translation: "How are you?" },
      { text: "화이팅!", translation: "You can do it!" },
      { text: "대박!", translation: "Awesome!" },
    ];
  } else if (dialect.includes("Arabic") || dialect.includes("العربية")) {
    return [
      { text: "كيف حالك؟", translation: "How are you?" },
      { text: "يلا بينا!", translation: "Let's go!" },
      { text: "ما شاء الله", translation: "God has willed it (expression of admiration)" },
    ];
  } else if (dialect.includes("Australian")) {
    return [
      { text: "G'day mate!", translation: "Hello friend!" },
      { text: "No worries", translation: "It's all good" },
      { text: "She'll be right", translation: "It will be fine" },
    ];
  } else if (dialect.includes("Indian")) {
    return [
      { text: "Namaste, kaise ho?", translation: "Hello, how are you?" },
      { text: "Sab theek hai", translation: "Everything is fine" },
      { text: "Chalo, shuru karte hain", translation: "Let's start" },
    ];
  } else if (dialect.includes("South African")) {
    return [
      { text: "Howzit, bru?", translation: "How's it going, bro?" },
      { text: "Lekker!", translation: "Great / Awesome!" },
      { text: "Just now", translation: "Soon (could be anytime)" },
    ];
  } else {
    return [
      { text: "Hello! Let's learn together.", translation: "A warm greeting" },
      { text: "Practice makes perfect.", translation: "Encouragement" },
      { text: "You're doing great!", translation: "Positive reinforcement" },
    ];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  heroSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.secondary,
  },
  teacherName: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  teacherOrigin: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: "row",
    gap: 24,
  },
  quickActionBtn: {
    alignItems: "center",
    gap: 4,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  // Tab Bar
  tabBarContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    marginTop: 8,
  },
  tabBarScroll: {
    paddingHorizontal: 16,
    gap: 0,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: Colors.secondary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.secondary,
  },
  // Tab Content
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  infoCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 2,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  phraseCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  phraseText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  phraseTranslation: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  // Empty tab states
  emptyTabState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTabTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptyTabSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  // Audio tab
  audioSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  audioSectionSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  audioItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  audioPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  audioItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  audioItemSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  audioDuration: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  audioItemActive: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + "10",
  },
  audioPlayBtnActive: {
    backgroundColor: Colors.accent,
  },
  audioWaveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  hdVoiceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.gold + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  hdVoiceText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.gold,
  },
  // Settings Section (WhatsApp style)
  settingsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  settingsCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingsLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  settingsValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  settingsDivider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginLeft: 48,
  },
});
