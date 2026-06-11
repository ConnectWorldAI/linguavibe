import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useI18n, SUPPORTED_LANGUAGES, type AppLanguage } from "@/lib/i18n";
import { BrandName } from "@/components/brand-name";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { isFeatureEnabled, trackExperiment } from "@/lib/feature-flags";
import { redeemReferralCode, isValidReferralCode, REFERRAL_REWARDS } from "@/lib/referral-incentive";
import { shouldPlayHaptic } from "@/lib/sound-settings";

const { width } = Dimensions.get("window");

// ─── DIALECT DATA ────────────────────────────────────────────────────────────
// Languages with dialect sub-categories shown during target language selection
interface DialectOption {
  code: string;
  name: string;
  flag: string;
  region: string;
}

interface LanguageWithDialects {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
  dialects?: DialectOption[];
}

const LANGUAGES_WITH_DIALECTS: LanguageWithDialects[] = [
  {
    code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español",
    dialects: [
      { code: "es", name: "Standard Spanish", flag: "🇪🇸", region: "Spain" },
      { code: "es-DO", name: "Dominican Spanish", flag: "🇩🇴", region: "Dominican Republic" },
      { code: "es-MX", name: "Mexican Spanish", flag: "🇲🇽", region: "Mexico" },
      { code: "es-CO", name: "Colombian Spanish", flag: "🇨🇴", region: "Colombia" },
      { code: "es-VE", name: "Venezuelan Spanish", flag: "🇻🇪", region: "Venezuela" },
      { code: "es-CU", name: "Cuban Spanish", flag: "🇨🇺", region: "Cuba" },
      { code: "es-CR", name: "Costa Rican Spanish", flag: "🇨🇷", region: "Costa Rica" },
      { code: "es-AR", name: "Argentine Spanish", flag: "🇦🇷", region: "Argentina" },
      { code: "es-PE", name: "Peruvian Spanish", flag: "🇵🇪", region: "Peru" },
      { code: "es-CL", name: "Chilean Spanish", flag: "🇨🇱", region: "Chile" },
      { code: "es-PR", name: "Puerto Rican Spanish", flag: "🇵🇷", region: "Puerto Rico" },
    ],
  },
  {
    code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français",
    dialects: [
      { code: "fr", name: "Standard French", flag: "🇫🇷", region: "France" },
      { code: "fr-HT", name: "Haitian Creole", flag: "🇭🇹", region: "Haiti" },
      { code: "fr-QC", name: "Québécois French", flag: "🇨🇦", region: "Canada" },
      { code: "fr-SN", name: "African French", flag: "🇸🇳", region: "Senegal / West Africa" },
    ],
  },
  {
    code: "pt", name: "Portuguese", flag: "🇧🇷", nativeName: "Português",
    dialects: [
      { code: "pt-BR", name: "Brazilian Portuguese", flag: "🇧🇷", region: "Brazil" },
      { code: "pt-PT", name: "European Portuguese", flag: "🇵🇹", region: "Portugal" },
    ],
  },
  {
    code: "ar", name: "Arabic", flag: "🇸🇦", nativeName: "العربية",
    dialects: [
      { code: "ar", name: "Modern Standard Arabic", flag: "🇸🇦", region: "Standard" },
      { code: "ar-EG", name: "Egyptian Arabic", flag: "🇪🇬", region: "Egypt" },
      { code: "ar-LB", name: "Levantine Arabic", flag: "🇱🇧", region: "Lebanon / Syria" },
      { code: "ar-AE", name: "Gulf Arabic", flag: "🇦🇪", region: "UAE / Saudi" },
    ],
  },
  {
    code: "zh", name: "Chinese", flag: "🇨🇳", nativeName: "中文",
    dialects: [
      { code: "zh", name: "Mandarin Chinese", flag: "🇨🇳", region: "Mainland China" },
      { code: "zh-TW", name: "Traditional Chinese", flag: "🇹🇼", region: "Taiwan" },
      { code: "zh-HK", name: "Cantonese", flag: "🇭🇰", region: "Hong Kong" },
    ],
  },
  {
    code: "en", name: "English", flag: "🇺🇸", nativeName: "English",
    dialects: [
      { code: "en", name: "American English", flag: "🇺🇸", region: "United States" },
      { code: "en-GB", name: "British English", flag: "🇬🇧", region: "United Kingdom" },
      { code: "en-AU", name: "Australian English", flag: "🇦🇺", region: "Australia" },
      { code: "en-NG", name: "Nigerian English", flag: "🇳🇬", region: "Nigeria" },
      { code: "en-JM", name: "Jamaican English", flag: "🇯🇲", region: "Jamaica" },
      { code: "en-ZA", name: "South African English", flag: "🇿🇦", region: "South Africa" },
      { code: "en-IN", name: "Indian English", flag: "🇮🇳", region: "India" },
    ],
  },
  { code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
  { code: "ko", name: "Korean", flag: "🇰🇷", nativeName: "한국어" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", nativeName: "हिन्दी" },
  { code: "it", name: "Italian", flag: "🇮🇹", nativeName: "Italiano" },
  { code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "ru", name: "Russian", flag: "🇷🇺", nativeName: "Русский" },
  { code: "sw", name: "Swahili", flag: "🇰🇪", nativeName: "Kiswahili" },
  { code: "tl", name: "Filipino", flag: "🇵🇭", nativeName: "Tagalog" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳", nativeName: "Tiếng Việt" },
  { code: "th", name: "Thai", flag: "🇹🇭", nativeName: "ไทย" },
  { code: "tr", name: "Turkish", flag: "🇹🇷", nativeName: "Türkçe" },
  { code: "pl", name: "Polish", flag: "🇵🇱", nativeName: "Polski" },
  { code: "nl", name: "Dutch", flag: "🇳🇱", nativeName: "Nederlands" },
  { code: "sv", name: "Swedish", flag: "🇸🇪", nativeName: "Svenska" },
  { code: "no", name: "Norwegian", flag: "🇳🇴", nativeName: "Norsk" },
  { code: "da", name: "Danish", flag: "🇩🇰", nativeName: "Dansk" },
  { code: "fi", name: "Finnish", flag: "🇫🇮", nativeName: "Suomi" },
  { code: "el", name: "Greek", flag: "🇬🇷", nativeName: "Ελληνικά" },
  { code: "he", name: "Hebrew", flag: "🇮🇱", nativeName: "עברית" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺", nativeName: "Magyar" },
  { code: "cs", name: "Czech", flag: "🇨🇿", nativeName: "Čeština" },
  { code: "ro", name: "Romanian", flag: "🇷🇴", nativeName: "Română" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦", nativeName: "Українська" },
  { code: "id", name: "Indonesian", flag: "🇮🇩", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", flag: "🇲🇾", nativeName: "Bahasa Melayu" },
  { code: "bn", name: "Bengali", flag: "🇧🇩", nativeName: "বাংলা" },
  { code: "ta", name: "Tamil", flag: "🇮🇳", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", flag: "🇮🇳", nativeName: "తెలుగు" },
  { code: "ur", name: "Urdu", flag: "🇵🇰", nativeName: "اردو" },
  { code: "pa", name: "Punjabi", flag: "🇮🇳", nativeName: "ਪੰਜਾਬੀ" },
  { code: "am", name: "Amharic", flag: "🇪🇹", nativeName: "አማርኛ" },
  { code: "yo", name: "Yoruba", flag: "🇳🇬", nativeName: "Yorùbá" },
  { code: "ig", name: "Igbo", flag: "🇳🇬", nativeName: "Igbo" },
  { code: "zu", name: "Zulu", flag: "🇿🇦", nativeName: "isiZulu" },
  { code: "af", name: "Afrikaans", flag: "🇿🇦", nativeName: "Afrikaans" },
  { code: "fa", name: "Persian", flag: "🇮🇷", nativeName: "فارسی" },
  { code: "ne", name: "Nepali", flag: "🇳🇵", nativeName: "नेपाली" },
  { code: "ka", name: "Georgian", flag: "🇬🇪", nativeName: "ქართული" },
];

// ─── ONBOARDING SLIDES ───────────────────────────────────────────────────────
const WELCOME_SLIDES = [
  {
    id: 1,
    title: "Learn Through Music",
    subtitle: "Translate any song into your language — same beat, same vibe, same energy",
    icon: "musical-notes",
  },
  {
    id: 2,
    title: "Voice-to-Voice Teachers",
    subtitle: "Talk to AI teachers in real-time. Pick your dialect, accent, and slang style",
    icon: "call",
  },
  {
    id: 3,
    title: "Every Language, Every Slang",
    subtitle: "Dominican Spanish, Colombian Spanish, Nigerian English — learn how people REALLY talk",
    icon: "globe",
  },
];

export default function OnboardingScreen() {
  const { setLanguage } = useI18n();

  // Steps: 0-2 = welcome slides, 2.5 = quick-pick ("What brings you here?"), 3 = native language, 4 = target language, 5 = dialect picker, 6 = level, 7 = schedule, 8 = feature tour
  // Quick-pick step uses step value 9 to avoid breaking existing step numbering
  const [step, setStep] = useState(0);
  const [userIntent, setUserIntent] = useState<"phone" | "translator" | "learn" | null>(null);
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [minutesPerDay, setMinutesPerDay] = useState(15);
  const [preferredTime, setPreferredTime] = useState<"morning" | "afternoon" | "evening" | "night">("morning");
  const [tourStep, setTourStep] = useState(0);
  const [targetLanguage, setTargetLanguage] = useState("");
  const [targetDialect, setTargetDialect] = useState("");
  const [level, setLevel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [showDialectTip, setShowDialectTip] = useState(true);
  const [playingDialect, setPlayingDialect] = useState<string | null>(null);
  // Referral code redemption state
  const [referralCode, setReferralCode] = useState("");
  const [referralError, setReferralError] = useState("");
  const [referralSuccess, setReferralSuccess] = useState(false);
  const [referralRewards, setReferralRewards] = useState<{ bonusXP: number; streakFreezes: number; videoCallMinutes: number; translationCredits: number } | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  // Dialect audio preview using text-to-speech
  const DIALECT_PREVIEW_PHRASES: Record<string, string> = {
    "es": "Hola, ¿cómo estás? Bienvenido a nuestra clase.",
    "es-DO": "¿Qué lo que, manito? ¡Bienvenido a la clase!",
    "es-MX": "¡Hola, qué onda! Bienvenido a la clase, güey.",
    "es-CO": "¡Hola parcero! ¿Cómo vas? Bienvenido a la clase.",
    "es-VE": "¡Hola pana! ¿Cómo estás? Bienvenido a la clase.",
    "es-CU": "¡Oye, asere! ¿Qué bolá? Bienvenido a la clase.",
    "es-CR": "¡Pura vida, mae! Bienvenido a la clase.",
    "es-AR": "¡Hola, che! ¿Cómo andás? Bienvenido a la clase.",
    "es-PE": "¡Hola, causa! ¿Cómo estás? Bienvenido a la clase.",
    "es-CL": "¡Hola, po! ¿Cómo estái? Bienvenido a la clase.",
    "es-PR": "¡Wepa! ¿Qué es la que hay? Bienvenido a la clase.",
    "fr": "Bonjour! Comment allez-vous? Bienvenue dans notre classe.",
    "fr-HT": "Bonjou! Koman ou ye? Byenveni nan klas la.",
    "fr-QC": "Salut! Comment ça va? Bienvenue dans le cours.",
    "fr-SN": "Bonjour! Comment ça va? Bienvenue dans la classe.",
    "pt-BR": "Oi, tudo bem? Bem-vindo à nossa aula!",
    "pt-PT": "Olá, como está? Bem-vindo à nossa aula!",
    "ar": "مرحبا! كيف حالك؟ أهلا وسهلا في الصف.",
    "ar-EG": "أهلا! إزيك؟ نورت الفصل.",
    "ar-LB": "مرحبا! كيفك؟ أهلا وسهلا بالصف.",
    "ar-AE": "هلا! شلونك؟ حياك الله في الصف.",
    "zh": "你好！欢迎来到我们的课堂。",
    "zh-TW": "你好！歡迎來到我們的課堂。",
    "zh-HK": "你好！歡迎嚟到我哋嘅課堂。",
    "en": "Hey there! Welcome to our class. Let's get started.",
    "en-GB": "Hello! Lovely to have you. Shall we begin?",
    "en-AU": "G'day mate! Welcome to class. Let's crack on.",
    "en-NG": "Hello! How you dey? Welcome to our class.",
    "en-JM": "Wah gwaan! Welcome to di class. Mek we start.",
    "en-ZA": "Howzit! Welcome to class. Let's get going.",
    "en-IN": "Namaste! Welcome to our class. Let us begin.",
    "ja": "こんにちは！クラスへようこそ。始めましょう。",
    "ko": "안녕하세요! 수업에 오신 것을 환영합니다.",
    "hi": "नमस्ते! हमारी कक्षा में आपका स्वागत है।",
    "it": "Ciao! Benvenuto nella nostra classe.",
    "de": "Hallo! Willkommen in unserem Unterricht.",
    "ru": "Привет! Добро пожаловать в наш класс.",
  };

  const playDialectPreview = async (dialectCode: string, dialectName: string) => {
    if (playingDialect === dialectCode) {
      await Speech.stop();
      setPlayingDialect(null);
      return;
    }
    setPlayingDialect(dialectCode);
    const phrase = DIALECT_PREVIEW_PHRASES[dialectCode] || `Hello! Welcome to ${dialectName} class.`;
    // Map dialect code to BCP 47 language tag
    const langTag = dialectCode.includes("-") ? dialectCode : dialectCode;
    Speech.speak(phrase, {
      language: langTag,
      rate: 0.9,
      onDone: () => setPlayingDialect(null),
      onError: () => setPlayingDialect(null),
      onStopped: () => setPlayingDialect(null),
    });
  };

  // Filter languages based on search
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return LANGUAGES_WITH_DIALECTS;
    const q = searchQuery.toLowerCase();
    return LANGUAGES_WITH_DIALECTS.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.dialects?.some(d => d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // For native language step, use the flat SUPPORTED_LANGUAGES list
  const filteredNativeLanguages = useMemo(() => {
    if (!searchQuery.trim()) return SUPPORTED_LANGUAGES;
    const q = searchQuery.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      (l) => l.name.toLowerCase().includes(q) || l.nativeName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Quick complete for phone/translator users — skip all learning setup
  const handleQuickComplete = async (intent: "phone" | "translator") => {
    await AsyncStorage.setItem("@onboarding_complete", "true");
    await AsyncStorage.setItem("@onboarding_date", new Date().toISOString());
    await AsyncStorage.setItem("@user_intent", intent);
    await AsyncStorage.setItem("@native_language", nativeLanguage || "en");
    // Set sensible defaults so the app doesn't break
    await AsyncStorage.setItem("@target_language", "es");
    await AsyncStorage.setItem("@proficiency_level", "");
    if (nativeLanguage) {
      setLanguage(nativeLanguage as AppLanguage);
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Go straight to the app — phone or translator tab
    if (intent === "phone") {
      router.replace("/(tabs)/calls" as any);
    } else {
      router.replace("/(tabs)/translate" as any);
    }
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem("@onboarding_complete", "true");
    await AsyncStorage.setItem("@onboarding_date", new Date().toISOString());
    await AsyncStorage.setItem("@user_intent", "learn");
    await AsyncStorage.setItem("@native_language", nativeLanguage || "en");
    await AsyncStorage.setItem("@target_language", targetDialect || targetLanguage || "es");
    await AsyncStorage.setItem("@proficiency_level", level);
    await AsyncStorage.setItem("@learning_schedule", JSON.stringify({
      daysPerWeek,
      minutesPerDay,
      preferredTime,
    }));
    // Save learning preferences for methodology recommendation engine
    const learningPace = minutesPerDay <= 10 ? "slow" : minutesPerDay <= 20 ? "moderate" : "fast";
    await AsyncStorage.setItem("@learning_preferences", JSON.stringify({
      level: level || "beginner",
      pace: learningPace,
      daysPerWeek,
      minutesPerDay,
      preferredTime,
      targetLanguage: targetDialect || targetLanguage || "es",
      nativeLanguage: nativeLanguage || "en",
    }));
    // Flag that methodology recommendation should be shown on first home visit
    await AsyncStorage.setItem("@show_methodology_recommendation", "true");
    if (nativeLanguage) {
      setLanguage(nativeLanguage as AppLanguage);
    }
    if (Platform.OS !== "web") {
      const hapticOn = await shouldPlayHaptic();
      if (hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Route to referral code entry before placement test
    setStep(11);
  };

  // ─── WELCOME SLIDES ──────────────────────────────────────────────────────────
  const renderWelcomeSlides = () => (
    <View style={styles.slideContainer}>
      <BrandName size="md" showTagline animated animationDelay={100} taglineColor={Colors.textSecondary} glow />

      <View style={styles.iconContainer}>
        <Ionicons
          name={WELCOME_SLIDES[step].icon as any}
          size={64}
          color={Colors.secondary}
        />
      </View>
      <Text style={styles.slideTitle}>{WELCOME_SLIDES[step].title}</Text>
      <Text style={styles.slideSubtitle}>{WELCOME_SLIDES[step].subtitle}</Text>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {WELCOME_SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (step < 2) setStep(step + 1);
          else {
            setSearchQuery("");
            setStep(9); // Go to quick-pick
          }
        }}
      >
        <Text style={styles.primaryButtonText}>
          {step < 2 ? "Next" : "Get Started"}
        </Text>
      </TouchableOpacity>

      {step < 2 && (
        <TouchableOpacity onPress={() => { setSearchQuery(""); setStep(9); }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── NATIVE LANGUAGE SELECTION (Step 3) ────────────────────────────────────
  const renderNativeLanguageSelection = () => (
    <View style={styles.selectionContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => { setSearchQuery(""); setStep(2); }}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.selectionTitle}>I speak...</Text>
      <Text style={styles.selectionSubtitle}>Select your native language</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search languages..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="done"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredNativeLanguages}
        keyExtractor={(item) => item.code}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item: lang }) => {
          const isSelected = nativeLanguage === lang.code;
          return (
            <TouchableOpacity
              style={[styles.langRow, isSelected && styles.langRowSelected]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNativeLanguage(lang.code);
                setSearchQuery("");
                setTimeout(() => setStep(4), 250);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.languageName}>{lang.name}</Text>
                <Text style={styles.langNativeLabel}>{lang.nativeName}</Text>
              </View>
              {isSelected && <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  // ─── TARGET LANGUAGE SELECTION WITH DIALECTS (Step 4) ──────────────────────
  const renderTargetLanguageSelection = () => {
    // Filter out native language from target options
    const available = filteredLanguages.filter(l => l.code !== nativeLanguage);

    return (
      <View style={styles.selectionContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => { setSearchQuery(""); setExpandedLang(null); setStep(3); }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.selectionTitle}>I want to learn...</Text>
        <Text style={styles.selectionSubtitle}>
          Choose your target language
        </Text>

        {/* First-time dialect tooltip */}
        {showDialectTip && (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: Colors.secondary + "15",
              borderWidth: 1,
              borderColor: Colors.secondary + "40",
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              marginHorizontal: 4,
            }}
            onPress={() => setShowDialectTip(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle" size={22} color={Colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.textPrimary, fontSize: 13, fontWeight: "600", marginBottom: 2 }}>
                What are dialects?
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
                Some languages (like Spanish) have regional variations. Tap a language with a{" "}
                <Text style={{ color: Colors.secondary, fontWeight: "600" }}>"dialects"</Text> badge to see
                all regional options (e.g., Dominican, Mexican, Colombian). This helps us teach you the
                exact accent and slang you want.
              </Text>
            </View>
            <Ionicons name="close" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search languages or dialects..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="done"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={available}
          keyExtractor={(item) => item.code}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item: lang }) => {
            const hasDialects = lang.dialects && lang.dialects.length > 0;
            const isExpanded = expandedLang === lang.code;
            const isSelected = targetLanguage === lang.code && !targetDialect;

            return (
              <View>
                {/* Main language row */}
                <TouchableOpacity
                  style={[styles.langRow, isSelected && styles.langRowSelected]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (hasDialects) {
                      // Feature flag: auto-skip dialect picker for single-dialect languages
                      const isSingleDialect = lang.dialects && lang.dialects.length === 1;
                      if (isSingleDialect) {
                        isFeatureEnabled("onboarding_skip_dialect_single").then((enabled) => {
                          if (enabled) {
                            // Auto-select the only dialect and advance
                            setTargetLanguage(lang.code);
                            setTargetDialect(lang.dialects![0].code);
                            setSearchQuery("");
                            setExpandedLang(null);
                            trackExperiment("onboarding_flow_v2", "skip_single", "dialect_auto_skipped", { language: lang.code });
                            setTimeout(() => setStep(6), 250);
                          } else {
                            // Control group: show dialect picker normally
                            setExpandedLang(isExpanded ? null : lang.code);
                            trackExperiment("onboarding_flow_v2", "control", "dialect_shown", { language: lang.code });
                          }
                        });
                      } else {
                        // Multiple dialects — always show picker
                        setExpandedLang(isExpanded ? null : lang.code);
                      }
                    } else {
                      // No dialects — select directly and advance
                      setTargetLanguage(lang.code);
                      setTargetDialect("");
                      setSearchQuery("");
                      setExpandedLang(null);
                      setTimeout(() => setStep(6), 250);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.languageName}>{lang.name}</Text>
                    <Text style={styles.langNativeLabel}>{lang.nativeName}</Text>
                  </View>
                  {hasDialects && (
                    <View style={styles.dialectBadge}>
                      <Text style={styles.dialectBadgeText}>{lang.dialects!.length} dialects</Text>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={Colors.secondary}
                      />
                    </View>
                  )}
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />}
                </TouchableOpacity>

                {/* Dialect sub-options */}
                {hasDialects && isExpanded && (
                  <View style={styles.dialectsContainer}>
                    {lang.dialects!.map((dialect) => {
                      const isDialectSelected = targetDialect === dialect.code;
                      return (
                        <TouchableOpacity
                          key={dialect.code}
                          style={[styles.dialectRow, isDialectSelected && styles.dialectRowSelected]}
                          onPress={() => {
                            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setTargetLanguage(lang.code);
                            setTargetDialect(dialect.code);
                            setSearchQuery("");
                            setExpandedLang(null);
                            setTimeout(() => setStep(6), 250);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 22 }}>{dialect.flag}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dialectName}>{dialect.name}</Text>
                            <Text style={styles.dialectRegion}>{dialect.region}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              playDialectPreview(dialect.code, dialect.name);
                            }}
                            style={{ padding: 6, marginRight: 4 }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name={playingDialect === dialect.code ? "volume-high" : "volume-medium"} size={18} color={playingDialect === dialect.code ? Colors.secondary : Colors.textSecondary} />
                          </TouchableOpacity>
                          {isDialectSelected && <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          }}
        />
      </View>
    );
  };

  // ─── LEVEL SELECTION (Step 6) ──────────────────────────────────────────────
  const renderLevelSelection = () => {
    const LEVELS = [
      { id: "beginner", label: "Complete Beginner", desc: "I'm starting from zero", icon: "leaf", color: "#22C55E" },
      { id: "elementary", label: "Elementary", desc: "I know basic words and phrases", icon: "flower", color: "#3B82F6" },
      { id: "intermediate", label: "Intermediate", desc: "I can hold simple conversations", icon: "trending-up", color: "#F59E0B" },
      { id: "advanced", label: "Advanced", desc: "I'm nearly fluent, want to perfect it", icon: "rocket", color: "#8B5CF6" },
    ];

    const selectedLangName = LANGUAGES_WITH_DIALECTS.find(l => l.code === targetLanguage)?.name || "your language";
    const selectedDialectName = targetDialect
      ? LANGUAGES_WITH_DIALECTS.find(l => l.code === targetLanguage)?.dialects?.find(d => d.code === targetDialect)?.name
      : null;

    return (
      <View style={styles.selectionContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => { setStep(4); setExpandedLang(null); }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.selectionTitle}>Your level?</Text>
        <Text style={styles.selectionSubtitle}>
          In {selectedDialectName || selectedLangName} — this helps us start you at the right place
        </Text>

        {LEVELS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.levelCard, level === item.id && styles.levelCardSelected]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setLevel(item.id);
                            setTimeout(() => setStep(7), 300);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon as any} size={24} color={level === item.id ? Colors.secondary : item.color} />
            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>{item.label}</Text>
              <Text style={styles.levelDesc}>{item.desc}</Text>
            </View>
            {level === item.id && <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />}
          </TouchableOpacity>
        ))}
        <View style={styles.aiNote}>
          <Ionicons name="sparkles" size={16} color={Colors.gold} />
          <Text style={styles.aiNoteText}>
            Don't worry — our AI adapts to your real level as you learn
          </Text>
        </View>
      </View>
    );
  };

  // ─── SCHEDULE SETUP (Step 7) ─────────────────────────────────────────────
  const TIME_OPTIONS = [
    { id: "morning" as const, label: "Morning", icon: "sunny", desc: "6am – 12pm", color: "#F59E0B" },
    { id: "afternoon" as const, label: "Afternoon", icon: "partly-sunny", desc: "12pm – 5pm", color: "#3B82F6" },
    { id: "evening" as const, label: "Evening", icon: "moon", desc: "5pm – 9pm", color: "#8B5CF6" },
    { id: "night" as const, label: "Night", icon: "cloudy-night", desc: "9pm – 12am", color: "#6366F1" },
  ];
  const MINUTE_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

  const renderScheduleSetup = () => (
    <View style={styles.selectionContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep(6)}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Ionicons name="calendar" size={48} color={Colors.secondary} style={{ alignSelf: "center", marginBottom: 12 }} />
      <Text style={styles.selectionTitle}>Set Your Schedule</Text>
      <Text style={styles.selectionSubtitle}>We'll build a personalized plan to help you reach your goals</Text>

      {/* Days per week */}
      <Text style={[styles.scheduleLabel, { color: Colors.textPrimary }]}>Days per week</Text>
      <View style={styles.scheduleRow}>
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.dayChip, daysPerWeek === d && { backgroundColor: Colors.secondary }]}
            onPress={() => { setDaysPerWeek(d); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[styles.dayChipText, daysPerWeek === d && { color: "#FFF" }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Minutes per day */}
      <Text style={[styles.scheduleLabel, { color: Colors.textPrimary }]}>Minutes per session</Text>
      <View style={styles.scheduleRow}>
        {MINUTE_OPTIONS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.minuteChip, minutesPerDay === m && { backgroundColor: Colors.secondary }]}
            onPress={() => { setMinutesPerDay(m); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[styles.minuteChipText, minutesPerDay === m && { color: "#FFF" }]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Preferred time */}
      <Text style={[styles.scheduleLabel, { color: Colors.textPrimary }]}>Best time to learn</Text>
      {TIME_OPTIONS.map((t) => (
        <TouchableOpacity
          key={t.id}
          style={[styles.timeCard, preferredTime === t.id && { borderColor: Colors.secondary, borderWidth: 2 }]}
          onPress={() => { setPreferredTime(t.id); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Ionicons name={t.icon as any} size={22} color={t.color} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.levelLabel, { color: Colors.textPrimary }]}>{t.label}</Text>
            <Text style={[styles.levelDesc, { color: Colors.textSecondary }]}>{t.desc}</Text>
          </View>
          {preferredTime === t.id && <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.continueBtn, { backgroundColor: Colors.secondary, marginTop: 16 }]}
        onPress={() => { setStep(8); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>

      <View style={styles.aiNote}>
        <Ionicons name="sparkles" size={16} color={Colors.gold} />
        <Text style={styles.aiNoteText}>
          AI will send you reminders and adjust your plan based on your progress
        </Text>
      </View>
    </View>
  );

  // ─── FEATURE TOUR (Step 8) ───────────────────────────────────────────────
  const TOUR_SLIDES = [
    {
      icon: "language",
      title: "Instant Translation",
      subtitle: "Translate text, voice, songs, and even live calls in real-time. Supports 40+ languages with dialect variants.",
      color: "#3B82F6",
      features: ["Real-time as you type", "Voice playback in HD", "Song & lyric translation"],
    },
    {
      icon: "call",
      title: "AI Voice Calls",
      subtitle: "Talk to AI teachers who understand your emotions. Practice conversations that feel real.",
      color: "#8B5CF6",
      features: ["Emotional AI with Hume", "Voice cloning in your language", "Video call captions"],
    },
    {
      icon: "school",
      title: "Structured Learning",
      subtitle: "A1 to C2 curriculum with cultural immersion, karaoke, SRS flashcards, and daily challenges.",
      color: "#10B981",
      features: ["Personalized learning path", "Spaced repetition", "Gamified challenges"],
    },
    {
      icon: "people",
      title: "Connect & Practice",
      subtitle: "Join voice rooms, find language partners, and practice with native speakers worldwide.",
      color: "#F59E0B",
      features: ["Live voice rooms", "Partner messaging", "Language exchange"],
    },
  ];

  const renderFeatureTour = () => {
    const slide = TOUR_SLIDES[tourStep];
    return (
      <View style={styles.selectionContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => { if (tourStep > 0) { setTourStep(tourStep - 1); } else { setStep(7); } }}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.tourIconCircle, { backgroundColor: slide.color + "20" }]}>
          <Ionicons name={slide.icon as any} size={56} color={slide.color} />
        </View>
        <Text style={styles.selectionTitle}>{slide.title}</Text>
        <Text style={[styles.selectionSubtitle, { marginBottom: 20 }]}>{slide.subtitle}</Text>

        {slide.features.map((f, i) => (
          <View key={i} style={styles.tourFeatureRow}>
            <Ionicons name="checkmark-circle" size={18} color={slide.color} />
            <Text style={[styles.tourFeatureText, { color: Colors.textPrimary }]}>{f}</Text>
          </View>
        ))}

        {/* Dots */}
        <View style={[styles.dotRow, { marginTop: 24 }]}>
          {TOUR_SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === tourStep && { ...styles.dotActive, backgroundColor: slide.color }]} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: slide.color, marginTop: 20 }]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (tourStep < TOUR_SLIDES.length - 1) {
              setTourStep(tourStep + 1);
            } else {
              handleComplete();
            }
          }}
        >
          <Text style={styles.continueBtnText}>
            {tourStep < TOUR_SLIDES.length - 1 ? "Next" : "Start Learning!"}
          </Text>
        </TouchableOpacity>

        {tourStep < TOUR_SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => handleComplete()} style={{ marginTop: 12 }}>
            <Text style={[styles.skipText, { color: Colors.textSecondary }]}>Skip Tour</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ─── REFERRAL CODE ENTRY (Step 11) ───────────────────────────────────────
  const handleRedeemReferral = async () => {
    if (!referralCode.trim()) {
      setReferralError("");
      return;
    }
    setRedeeming(true);
    setReferralError("");
    const result = await redeemReferralCode(referralCode);
    setRedeeming(false);
    if (result.success && result.rewards) {
      setReferralSuccess(true);
      setReferralRewards(result.rewards);
      if (Platform.OS !== "web") {
        shouldPlayHaptic().then((on) => {
          if (on) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
      }
    } else {
      setReferralError(result.error || "Could not redeem code.");
      if (Platform.OS !== "web") {
        shouldPlayHaptic().then((on) => {
          if (on) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        });
      }
    }
  };

  const renderReferralCodeEntry = () => (
    <View style={styles.selectionContainer}>
      <Text style={[styles.selectionTitle, { fontSize: 24, marginTop: 40 }]}>
        Have a referral code?
      </Text>
      <Text style={[styles.selectionSubtitle, { fontSize: 15, lineHeight: 22 }]}>
        Enter a friend's code and you both earn rewards!
      </Text>

      {!referralSuccess ? (
        <>
          <View style={[styles.searchBar, { marginTop: 8 }]}>
            <Ionicons name="gift-outline" size={20} color={Colors.secondary} />
            <TextInput
              style={[styles.searchInput, { fontSize: 18, letterSpacing: 2, fontWeight: "700" }]}
              placeholder="CW-XXXXX"
              placeholderTextColor={Colors.textSecondary}
              value={referralCode}
              onChangeText={(t) => { setReferralCode(t.toUpperCase()); setReferralError(""); }}
              autoCapitalize="characters"
              maxLength={8}
              returnKeyType="done"
              onSubmitEditing={handleRedeemReferral}
            />
          </View>

          {referralError ? (
            <Text style={{ color: "#EF4444", fontSize: 13, marginTop: 8, marginLeft: 4 }}>
              {referralError}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: Colors.secondary, marginTop: 20, opacity: redeeming ? 0.6 : 1 }]}
            onPress={handleRedeemReferral}
            disabled={redeeming}
          >
            <Text style={styles.continueBtnText}>{redeeming ? "Checking..." : "Redeem Code"}</Text>
          </TouchableOpacity>

          <View style={[styles.aiNote, { marginTop: 16 }]}>
            <Ionicons name="gift" size={16} color={Colors.gold} />
            <Text style={styles.aiNoteText}>
              Both you and your friend get {REFERRAL_REWARDS.invitee.bonusXP} XP, {REFERRAL_REWARDS.invitee.streakFreezes} Streak Freeze, {REFERRAL_REWARDS.invitee.videoCallMinutes} min video calls, and {REFERRAL_REWARDS.invitee.translationCredits} translation credits!
            </Text>
          </View>
        </>
      ) : (
        <View style={{ alignItems: "center", marginTop: 24 }}>
          <View style={[styles.tourIconCircle, { width: 80, height: 80, borderRadius: 40, backgroundColor: "#22C55E20" }]}>
            <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
          </View>
          <Text style={[styles.selectionTitle, { fontSize: 22, marginTop: 16 }]}>Rewards Unlocked!</Text>
          {referralRewards && (
            <View style={{ marginTop: 12, gap: 6 }}>
              <Text style={{ color: Colors.textPrimary, fontSize: 15 }}>+{referralRewards.bonusXP} Bonus XP</Text>
              <Text style={{ color: Colors.textPrimary, fontSize: 15 }}>+{referralRewards.streakFreezes} Streak Freeze</Text>
              <Text style={{ color: Colors.textPrimary, fontSize: 15 }}>+{referralRewards.videoCallMinutes} min Video Calls</Text>
              <Text style={{ color: Colors.textPrimary, fontSize: 15 }}>+{referralRewards.translationCredits} Translation Credits</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.continueBtn, { backgroundColor: referralSuccess ? Colors.secondary : "transparent", marginTop: referralSuccess ? 32 : 16 }]}
        onPress={() => router.replace("/placement-test" as any)}
      >
        <Text style={[styles.continueBtnText, !referralSuccess && { color: Colors.textSecondary }]}>
          {referralSuccess ? "Continue" : "Skip"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ─── QUICK-PICK: "What brings you here?" (Step 9) ─────────────────────────────
  const QUICK_PICK_OPTIONS = [
    {
      id: "phone" as const,
      icon: "call" as const,
      title: "Make Calls",
      subtitle: "Use the phone to call friends and family",
      color: "#3B82F6",
    },
    {
      id: "translator" as const,
      icon: "language" as const,
      title: "Translate",
      subtitle: "Translate text, voice, or conversations",
      color: "#8B5CF6",
    },
    {
      id: "learn" as const,
      icon: "school" as const,
      title: "Learn a Language",
      subtitle: "Take classes, practice with AI teachers",
      color: "#10B981",
    },
  ];

  const renderQuickPick = () => (
    <View style={styles.selectionContainer}>
      <BrandName size="sm" showTagline={false} />

      <Text style={[styles.selectionTitle, { marginTop: 24, fontSize: 26 }]}>
        What brings you here?
      </Text>
      <Text style={[styles.selectionSubtitle, { fontSize: 16, lineHeight: 24 }]}>
        Pick what you want to do — you can always explore more later
      </Text>

      <View style={{ gap: 12, marginTop: 8 }}>
        {QUICK_PICK_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.levelCard, { gap: 16, padding: 20 }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setUserIntent(opt.id);
              if (opt.id === "learn") {
                // Continue with full learning onboarding
                setSearchQuery("");
                setStep(3);
              } else {
                // Phone or Translator — just ask native language then done
                setSearchQuery("");
                setStep(10); // Quick native language step
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.tourIconCircle, { width: 56, height: 56, borderRadius: 28, marginBottom: 0, marginTop: 0, backgroundColor: opt.color + "15" }]}>
              <Ionicons name={opt.icon as any} size={28} color={opt.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.levelLabel, { fontSize: 18 }]}>{opt.title}</Text>
              <Text style={[styles.levelDesc, { fontSize: 14, marginTop: 4 }]}>{opt.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ─── QUICK NATIVE LANGUAGE (Step 10) — for phone/translator users ──────────
  const renderQuickNativeLanguage = () => (
    <View style={styles.selectionContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep(9)}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      <Text style={[styles.selectionTitle, { fontSize: 24 }]}>What language do you speak?</Text>
      <Text style={styles.selectionSubtitle}>So we can set things up in your language</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search languages..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="done"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredNativeLanguages}
        keyExtractor={(item) => item.code}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item: lang }) => {
          const isSelected = nativeLanguage === lang.code;
          return (
            <TouchableOpacity
              style={[styles.langRow, isSelected && styles.langRowSelected]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNativeLanguage(lang.code);
                // Complete immediately — go to phone or translator
                setTimeout(() => handleQuickComplete(userIntent as "phone" | "translator"), 250);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.languageName, { fontSize: 17 }]}>{lang.name}</Text>
                <Text style={styles.langNativeLabel}>{lang.nativeName}</Text>
              </View>
              {isSelected && <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {step < 3 && renderWelcomeSlides()}
      {step === 3 && renderNativeLanguageSelection()}
      {step === 4 && renderTargetLanguageSelection()}
      {step === 6 && renderLevelSelection()}
      {step === 7 && renderScheduleSetup()}
      {step === 8 && renderFeatureTour()}
      {step === 9 && renderQuickPick()}
      {step === 10 && renderQuickNativeLanguage()}
      {step === 11 && renderReferralCodeEntry()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  slideContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  slideTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  slideSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.secondary,
    width: 24,
  },
  primaryButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.xl * 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  primaryButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  skipText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  selectionContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  selectionTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  selectionSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 6,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 12,
  },
  langRowSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + "15",
  },
  languageFlag: {
    fontSize: 28,
  },
  languageName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  langNativeLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  dialectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  dialectBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.secondary,
  },
  dialectsContainer: {
    marginLeft: 20,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.secondary + "40",
    paddingLeft: 12,
  },
  dialectRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  dialectRowSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + "15",
  },
  dialectName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  dialectRegion: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  levelCardSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + "15",
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  levelDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  aiNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    padding: 14,
    backgroundColor: Colors.goldGlow,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  aiNoteText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  // Schedule Setup styles
  scheduleLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  minuteChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surfaceCard,
  },
  minuteChipText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: 14,
    borderRadius: BorderRadius.md,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  continueBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
  },
  continueBtnText: {
    color: "#FFF",
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  // Feature Tour styles
  tourIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  tourFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dotRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
  },
  tourFeatureText: {
    fontSize: FontSize.md,
    fontWeight: "500",
  },
});
