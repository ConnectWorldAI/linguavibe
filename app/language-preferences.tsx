/**
 * Language Preferences — Onboarding step for setting native + target languages.
 * Users select their native language and one or more target languages with proficiency levels.
 * Persisted to AsyncStorage for personalization across the app.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "native";

interface TargetLanguage {
  code: string;
  level: ProficiencyLevel;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸", nativeName: "English" },
  { code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  { code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
  { code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "it", name: "Italian", flag: "🇮🇹", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", nativeName: "Português" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
  { code: "ko", name: "Korean", flag: "🇰🇷", nativeName: "한국어" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", nativeName: "中文" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", nativeName: "العربية" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", nativeName: "हिन्दी" },
  { code: "ru", name: "Russian", flag: "🇷🇺", nativeName: "Русский" },
  { code: "tr", name: "Turkish", flag: "🇹🇷", nativeName: "Türkçe" },
  { code: "nl", name: "Dutch", flag: "🇳🇱", nativeName: "Nederlands" },
  { code: "sv", name: "Swedish", flag: "🇸🇪", nativeName: "Svenska" },
  { code: "pl", name: "Polish", flag: "🇵🇱", nativeName: "Polski" },
  { code: "th", name: "Thai", flag: "🇹🇭", nativeName: "ไทย" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳", nativeName: "Tiếng Việt" },
  { code: "id", name: "Indonesian", flag: "🇮🇩", nativeName: "Bahasa Indonesia" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦", nativeName: "Українська" },
  { code: "el", name: "Greek", flag: "🇬🇷", nativeName: "Ελληνικά" },
  { code: "he", name: "Hebrew", flag: "🇮🇱", nativeName: "עברית" },
  { code: "sw", name: "Swahili", flag: "🇰🇪", nativeName: "Kiswahili" },
  { code: "tl", name: "Tagalog", flag: "🇵🇭", nativeName: "Tagalog" },
];

const PROFICIENCY_LEVELS: { key: ProficiencyLevel; label: string; description: string; color: string }[] = [
  { key: "beginner", label: "Beginner", description: "Just starting out", color: "#4ADE80" },
  { key: "intermediate", label: "Intermediate", description: "Can hold basic conversations", color: "#FFD700" },
  { key: "advanced", label: "Advanced", description: "Fluent in most situations", color: "#8B5CF6" },
];

const STORAGE_KEY = "@language_preferences";

// ─── Component ───────────────────────────────────────────────────────────────

export default function LanguagePreferencesScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: native, 2: targets, 3: levels
  const [nativeLanguage, setNativeLanguage] = useState<string | null>(null);
  const [targetLanguages, setTargetLanguages] = useState<string[]>([]);
  const [targetLevels, setTargetLevels] = useState<Record<string, ProficiencyLevel>>({});

  // Load saved preferences
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.nativeLanguage) setNativeLanguage(data.nativeLanguage);
          if (data.targetLanguages) setTargetLanguages(data.targetLanguages);
          if (data.targetLevels) setTargetLevels(data.targetLevels);
        }
      } catch (_) {}
    })();
  }, []);

  const handleSelectNative = (code: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNativeLanguage(code);
    // Remove from targets if already there
    setTargetLanguages((prev) => prev.filter((c) => c !== code));
  };

  const handleToggleTarget = (code: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTargetLanguages((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= 5) return prev; // max 5 targets
      return [...prev, code];
    });
  };

  const handleSetLevel = (code: string, level: ProficiencyLevel) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTargetLevels((prev) => ({ ...prev, [code]: level }));
  };

  const handleSave = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const prefs = { nativeLanguage, targetLanguages, targetLevels };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    router.back();
  };

  const canProceedStep1 = nativeLanguage !== null;
  const canProceedStep2 = targetLanguages.length > 0;
  const canFinish = targetLanguages.every((code) => targetLevels[code]);

  const availableTargets = LANGUAGES.filter((l) => l.code !== nativeLanguage);

  const getLanguageByCode = (code: string) => LANGUAGES.find((l) => l.code === code);

  // ─── Step 1: Select Native Language ──────────────────────────────────────

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepEmoji}>🌍</Text>
        <Text style={styles.stepTitle}>What's your native language?</Text>
        <Text style={styles.stepDesc}>This helps us find the best language exchange partners for you.</Text>
      </View>
      <FlatList
        data={LANGUAGES}
        keyExtractor={(item) => item.code}
        numColumns={2}
        columnWrapperStyle={styles.langGrid}
        contentContainerStyle={styles.langList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.langCard, nativeLanguage === item.code && styles.langCardSelected]}
            onPress={() => handleSelectNative(item.code)}
          >
            <Text style={styles.langFlag}>{item.flag}</Text>
            <Text style={styles.langName}>{item.name}</Text>
            <Text style={styles.langNative}>{item.nativeName}</Text>
            {nativeLanguage === item.code && (
              <View style={styles.checkMark}>
                <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={[styles.nextBtn, !canProceedStep1 && styles.nextBtnDisabled]}
        onPress={() => canProceedStep1 && setStep(2)}
        disabled={!canProceedStep1}
      >
        <Text style={styles.nextBtnText}>Continue</Text>
        <Ionicons name="arrow-forward" size={18} color="#000" />
      </TouchableOpacity>
    </View>
  );

  // ─── Step 2: Select Target Languages ─────────────────────────────────────

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepEmoji}>🎯</Text>
        <Text style={styles.stepTitle}>What languages are you learning?</Text>
        <Text style={styles.stepDesc}>Select up to 5 languages you want to practice. We'll match you with native speakers.</Text>
      </View>
      {targetLanguages.length > 0 && (
        <View style={styles.selectedChips}>
          {targetLanguages.map((code) => {
            const lang = getLanguageByCode(code);
            return (
              <TouchableOpacity
                key={code}
                style={styles.selectedChip}
                onPress={() => handleToggleTarget(code)}
              >
                <Text style={styles.selectedChipFlag}>{lang?.flag}</Text>
                <Text style={styles.selectedChipText}>{lang?.name}</Text>
                <Ionicons name="close-circle" size={16} color="#FF6B6B" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <FlatList
        data={availableTargets}
        keyExtractor={(item) => item.code}
        numColumns={2}
        columnWrapperStyle={styles.langGrid}
        contentContainerStyle={styles.langList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.langCard, targetLanguages.includes(item.code) && styles.langCardTarget]}
            onPress={() => handleToggleTarget(item.code)}
          >
            <Text style={styles.langFlag}>{item.flag}</Text>
            <Text style={styles.langName}>{item.name}</Text>
            <Text style={styles.langNative}>{item.nativeName}</Text>
            {targetLanguages.includes(item.code) && (
              <View style={styles.checkMark}>
                <Ionicons name="checkmark-circle" size={20} color="#00AAFF" />
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={18} color="#94A3B8" />
          <Text style={styles.backStepText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceedStep2 && styles.nextBtnDisabled]}
          onPress={() => canProceedStep2 && setStep(3)}
          disabled={!canProceedStep2}
        >
          <Text style={styles.nextBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Step 3: Set Proficiency Levels ──────────────────────────────────────

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepEmoji}>📊</Text>
        <Text style={styles.stepTitle}>What's your level?</Text>
        <Text style={styles.stepDesc}>Set your proficiency for each language so we can match you with the right partners.</Text>
      </View>
      <ScrollView style={styles.levelsList} showsVerticalScrollIndicator={false}>
        {targetLanguages.map((code) => {
          const lang = getLanguageByCode(code);
          return (
            <View key={code} style={styles.levelCard}>
              <View style={styles.levelCardHeader}>
                <Text style={styles.levelCardFlag}>{lang?.flag}</Text>
                <Text style={styles.levelCardName}>{lang?.name}</Text>
              </View>
              <View style={styles.levelOptions}>
                {PROFICIENCY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.key}
                    style={[
                      styles.levelOption,
                      targetLevels[code] === level.key && { backgroundColor: level.color + "20", borderColor: level.color + "60" },
                    ]}
                    onPress={() => handleSetLevel(code, level.key)}
                  >
                    <Text style={[styles.levelOptionLabel, targetLevels[code] === level.key && { color: level.color }]}>
                      {level.label}
                    </Text>
                    <Text style={styles.levelOptionDesc}>{level.description}</Text>
                    {targetLevels[code] === level.key && (
                      <Ionicons name="checkmark" size={16} color={level.color} style={{ position: "absolute", top: 8, right: 8 }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(2)}>
          <Ionicons name="arrow-back" size={18} color="#94A3B8" />
          <Text style={styles.backStepText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !canFinish && styles.nextBtnDisabled]}
          onPress={() => canFinish && handleSave()}
          disabled={!canFinish}
        >
          <Ionicons name="checkmark" size={18} color="#000" />
          <Text style={styles.saveBtnText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Progress Indicator ──────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Language Setup</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive, s === step && styles.progressDotCurrent]} />
          ))}
        </View>

        {/* Steps */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1a" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },

  // Progress
  progressRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 },
  progressDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#2a2a3e" },
  progressDotActive: { backgroundColor: "#FFD700" + "60" },
  progressDotCurrent: { backgroundColor: "#FFD700" },

  // Steps
  stepContainer: { flex: 1, paddingHorizontal: 16 },
  stepHeader: { alignItems: "center", marginBottom: 24 },
  stepEmoji: { fontSize: 40, marginBottom: 12 },
  stepTitle: { fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center" },
  stepDesc: { fontSize: 14, color: "#94A3B8", textAlign: "center", marginTop: 8, lineHeight: 20 },

  // Language Grid
  langGrid: { gap: 10, marginBottom: 10 },
  langList: { paddingBottom: 80 },
  langCard: {
    flex: 1, backgroundColor: "#1a1a2e", borderRadius: 14, padding: 14,
    alignItems: "center", gap: 4, borderWidth: 1.5, borderColor: "#2a2a3e",
    position: "relative",
  },
  langCardSelected: { borderColor: "#4ADE80", backgroundColor: "#4ADE80" + "10" },
  langCardTarget: { borderColor: "#00AAFF", backgroundColor: "#00AAFF" + "10" },
  langFlag: { fontSize: 28 },
  langName: { fontSize: 13, fontWeight: "700", color: "#fff", marginTop: 4 },
  langNative: { fontSize: 11, color: "#64748B" },
  checkMark: { position: "absolute", top: 8, right: 8 },

  // Selected chips
  selectedChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  selectedChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#00AAFF" + "15", borderWidth: 1, borderColor: "#00AAFF" + "30",
  },
  selectedChipFlag: { fontSize: 14 },
  selectedChipText: { fontSize: 12, fontWeight: "600", color: "#00AAFF" },

  // Level cards
  levelsList: { flex: 1 },
  levelCard: { backgroundColor: "#1a1a2e", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#2a2a3e" },
  levelCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  levelCardFlag: { fontSize: 24 },
  levelCardName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  levelOptions: { gap: 8 },
  levelOption: {
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#2a2a3e",
    backgroundColor: "#0a0a1a", position: "relative",
  },
  levelOptionLabel: { fontSize: 14, fontWeight: "700", color: "#fff" },
  levelOptionDesc: { fontSize: 11, color: "#64748B", marginTop: 2 },

  // Navigation
  navRow: { flexDirection: "row", gap: 12, paddingVertical: 16 },
  nextBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FFD700", paddingVertical: 16, borderRadius: 14,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 16, fontWeight: "700", color: "#000" },
  backStepBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 16, borderRadius: 14,
    backgroundColor: "#1a1a2e", borderWidth: 1, borderColor: "#2a2a3e",
  },
  backStepText: { fontSize: 14, fontWeight: "600", color: "#94A3B8" },
  saveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#4ADE80", paddingVertical: 16, borderRadius: 14,
  },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#000" },
});
