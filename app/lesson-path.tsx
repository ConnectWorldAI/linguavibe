import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useSubscription, canAccessFeature } from "@/hooks/use-subscription";
import {
  getCurriculum,
  getAvailableCurricula,
  type CEFRLevel,
  type LessonCategory,
  type Lesson,
  type Unit,
  type LanguageCurriculum,
} from "@/lib/curriculum-data";

// ─── Constants ───────────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<CEFRLevel, string> = {
  A1: "#EF4444", A2: "#F97316", B1: "#EAB308", B2: "#22C55E", C1: "#3B82F6", C2: "#8B5CF6",
};

const CATEGORY_ICONS: Record<LessonCategory, string> = {
  grammar: "construct", vocabulary: "book", reading: "document-text",
  writing: "create", speaking: "mic", listening: "headset",
};

const STORAGE_KEY = "@lesson_progress";

// ─── Component ───────────────────────────────────────────────────────────────
export default function LessonPathScreen() {
  const router = useRouter();
  const { plan } = useSubscription();
  const hasProLessons = canAccessFeature(plan, "pro_lessons");

  // Multi-language state
  const [activeLang, setActiveLang] = useState<string>("es");
  const [availableLanguages, setAvailableLanguages] = useState<{ code: string; name: string; flag: string }[]>([]);
  const [curriculum, setCurriculum] = useState<LanguageCurriculum | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);

  // Progress state
  const [userLevel, setUserLevel] = useState<CEFRLevel>("A1");
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | "all">("all");
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadLanguageAndProgress();
  }, []);

  useEffect(() => {
    // Load curriculum when language changes
    const curr = getCurriculum(activeLang);
    setCurriculum(curr);
  }, [activeLang]);

  const loadLanguageAndProgress = async () => {
    try {
      // Load target language(s) from preferences
      const langPrefs = await AsyncStorage.getItem("@language_preferences");
      const targetLang = await AsyncStorage.getItem("@target_language");

      let languages: { code: string; name: string; flag: string }[] = [];

      if (langPrefs) {
        const prefs = JSON.parse(langPrefs);
        if (prefs.targetLanguages && prefs.targetLanguages.length > 0) {
          // Map language codes to display info
          const allCurricula = getAvailableCurricula();
          languages = prefs.targetLanguages.map((code: string) => {
            const curr = allCurricula.find(c => c.code === code || c.code.startsWith(code));
            return { code, name: curr?.name || code, flag: curr?.flag || "🌐" };
          });
        }
      }

      // Fallback: use @target_language or default to Spanish
      if (languages.length === 0) {
        const code = targetLang || "es";
        const curr = getCurriculum(code);
        languages = [{ code, name: curr.name, flag: curr.flag }];
      }

      setAvailableLanguages(languages);
      setActiveLang(languages[0].code);

      // Load CEFR level
      const level = await AsyncStorage.getItem("@cefr_level");
      if (level) setUserLevel(level as CEFRLevel);

      // Load progress
      const progress = await AsyncStorage.getItem(STORAGE_KEY);
      if (progress) setCompletedLessons(new Set(JSON.parse(progress)));
    } catch (e) {}
  };

  const switchLanguage = (code: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveLang(code);
    setShowLangPicker(false);
    setExpandedUnit(null);
    setSelectedLevel("all");
  };

  const saveProgress = async (lessons: Set<string>) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...lessons]));
  };

  const completeLesson = async (lessonId: string) => {
    const updated = new Set(completedLessons);
    updated.add(lessonId);
    setCompletedLessons(updated);
    await saveProgress(updated);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getLessonStatus = (lesson: Lesson, unitLessons: Lesson[]): "locked" | "available" | "completed" => {
    if (completedLessons.has(lesson.id)) return "completed";
    if (lesson.order === 1) return "available";
    const prevLesson = unitLessons.find(l => l.order === lesson.order - 1);
    if (prevLesson && completedLessons.has(prevLesson.id)) return "available";
    return "locked";
  };

  const getUnitProgress = (unit: Unit): number => {
    const completed = unit.lessons.filter(l => completedLessons.has(l.id)).length;
    return completed / unit.lessons.length;
  };

  if (!curriculum) return null;

  const filteredUnits = selectedLevel === "all"
    ? curriculum.units
    : curriculum.units.filter(u => u.level === selectedLevel);

  const totalXP = curriculum.units.flatMap(u => u.lessons)
    .filter(l => completedLessons.has(l.id))
    .reduce((sum, l) => sum + l.xp, 0);

  const completedCount = curriculum.units.flatMap(u => u.lessons)
    .filter(l => completedLessons.has(l.id)).length;

  const renderLevelFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      <TouchableOpacity
        style={[styles.filterChip, selectedLevel === "all" && styles.filterChipActive]}
        onPress={() => setSelectedLevel("all")}
      >
        <Text style={[styles.filterChipText, selectedLevel === "all" && styles.filterChipTextActive]}>All</Text>
      </TouchableOpacity>
      {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((level) => (
        <TouchableOpacity
          key={level}
          style={[styles.filterChip, selectedLevel === level && styles.filterChipActive, selectedLevel === level && { backgroundColor: LEVEL_COLORS[level] + "20" }]}
          onPress={() => setSelectedLevel(level)}
        >
          <Text style={[styles.filterChipText, selectedLevel === level && { color: LEVEL_COLORS[level] }]}>{level}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderUnit = ({ item: unit }: { item: Unit }) => {
    const progress = getUnitProgress(unit);
    const isExpanded = expandedUnit === unit.id;
    const levelColor = LEVEL_COLORS[unit.level];
    const isPremiumLevel = ["B2", "C1", "C2"].includes(unit.level);
    const isLocked = isPremiumLevel && !hasProLessons;

    return (
      <View style={[styles.unitCard, isLocked && { opacity: 0.7 }]}>
        <TouchableOpacity
          style={styles.unitHeader}
          onPress={() => {
            if (isLocked) {
              setShowUpgradeModal(true);
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              return;
            }
            setExpandedUnit(isExpanded ? null : unit.id);
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.unitLevelBadge, { backgroundColor: levelColor + "20" }]}>
            <Text style={[styles.unitLevelText, { color: levelColor }]}>{unit.level}</Text>
          </View>
          <View style={styles.unitInfo}>
            <Text style={styles.unitTitle}>{unit.title}</Text>
            <Text style={styles.unitDesc} numberOfLines={1}>{unit.description}</Text>
            <View style={styles.unitProgressBar}>
              <View style={[styles.unitProgressFill, { width: `${progress * 100}%`, backgroundColor: levelColor }]} />
            </View>
          </View>
          <View style={styles.unitMeta}>
            {isLocked ? (
              <>
                <View style={{ backgroundColor: Colors.gold + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.gold }}>PRO</Text>
                </View>
                <Ionicons name="lock-closed" size={16} color={Colors.gold} />
              </>
            ) : (
              <>
                <Text style={styles.unitMetaText}>{Math.round(progress * 100)}%</Text>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.textMuted} />
              </>
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.lessonsList}>
            {unit.lessons.map((lesson) => {
              const status = getLessonStatus(lesson, unit.lessons);
              return (
                <View key={lesson.id}>
                <TouchableOpacity
                  style={[styles.lessonRow, status === "locked" && styles.lessonLocked]}
                  onPress={() => {
                    if (status === "locked") return;
                    // Route to AI-powered adaptive lesson with cultural context
                    router.push({
                      pathname: "/adaptive-lesson" as any,
                      params: {
                        lessonId: lesson.id,
                        topic: lesson.title,
                        category: lesson.category,
                        level: lesson.level,
                        language: curriculum?.name || "Spanish",
                        culturalHint: lesson.culturalHint || lesson.description || "",
                      },
                    });
                  }}
                  activeOpacity={status === "locked" ? 1 : 0.7}
                  disabled={status === "locked"}
                >
                  <View style={[styles.lessonIcon, status === "completed" && { backgroundColor: Colors.success + "20" }]}>
                    {status === "completed" ? (
                      <Ionicons name="checkmark" size={16} color={Colors.success} />
                    ) : status === "locked" ? (
                      <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
                    ) : (
                      <Ionicons name={CATEGORY_ICONS[lesson.category] as any} size={14} color={levelColor} />
                    )}
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text style={[styles.lessonTitle, status === "locked" && { color: Colors.textMuted }]}>{lesson.title}</Text>
                    <Text style={styles.lessonDesc} numberOfLines={1}>{lesson.description}</Text>
                  </View>
                  <View style={styles.lessonMeta}>
                    <Text style={styles.lessonDuration}>{lesson.duration}m</Text>
                    <Text style={styles.lessonXp}>+{lesson.xp} XP</Text>
                  </View>
                </TouchableOpacity>
                {/* Visual Mode button for vocabulary lessons */}
                {lesson.category === "vocabulary" && status !== "locked" && (
                  <TouchableOpacity
                    style={styles.visualModeBtn}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.push({
                        pathname: "/visual-association-exercise" as any,
                        params: {
                          topic: lesson.title,
                          language: curriculum?.name || "Spanish",
                          dialect: curriculum?.dialect || "",
                          level: lesson.level,
                          lessonId: lesson.id,
                        },
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="eye-outline" size={14} color="#6C63FF" />
                    <Text style={styles.visualModeBtnText}>Visual Mode</Text>
                    <Text style={styles.visualModeBtnTag}>CIA</Text>
                  </TouchableOpacity>
                )}
                {/* Whiteboard Mode button for all lesson types */}
                {status !== "locked" && (
                  <TouchableOpacity
                    style={[styles.visualModeBtn, { borderColor: "#10B981" }]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.push({
                        pathname: "/whiteboard-lesson" as any,
                        params: {
                          topic: lesson.title,
                          language: curriculum?.name || "Spanish",
                          dialect: curriculum?.dialect || "",
                          level: lesson.level,
                          lessonId: lesson.id,
                          category: lesson.category,
                        },
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="easel-outline" size={14} color="#10B981" />
                    <Text style={[styles.visualModeBtnText, { color: "#10B981" }]}>Whiteboard</Text>
                  </TouchableOpacity>
                )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning Path</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/certification-progress" as any,
                params: { language: curriculum?.name || "Spanish" },
              });
            }}
            style={styles.testBtn}
          >
            <Ionicons name="ribbon" size={18} color="#FFB800" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/cultural-feed" as any,
                params: {
                  language: curriculum?.name || "Spanish",
                  languageCode: curriculum?.code || "es-DO",
                  level: userLevel,
                },
              });
            }}
            style={styles.testBtn}
          >
            <Ionicons name="earth" size={18} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/placement-test" as any)} style={styles.testBtn}>
            <Ionicons name="school" size={18} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Switcher */}
      {availableLanguages.length > 1 && (
        <TouchableOpacity
          style={styles.langSwitcher}
          onPress={() => setShowLangPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.langSwitcherFlag}>
            {availableLanguages.find(l => l.code === activeLang)?.flag || "🌐"}
          </Text>
          <Text style={styles.langSwitcherText}>
            {curriculum.name}{curriculum.dialect ? ` (${curriculum.dialect})` : ""}
          </Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Curriculum Info Banner */}
      <View style={styles.curriculumBanner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerFlag}>{curriculum.flag}</Text>
          <View>
            <Text style={styles.bannerTitle}>
              {curriculum.name}{curriculum.dialect ? ` — ${curriculum.dialect}` : ""}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {curriculum.totalUnits} units · {curriculum.totalLessons} lessons · ~{curriculum.estimatedHours}h
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="ribbon" size={16} color={Colors.secondary} />
          <Text style={styles.statText}>Level: {userLevel}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color="#EAB308" />
          <Text style={styles.statText}>{totalXP} XP</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.statText}>{completedCount}/{curriculum.totalLessons}</Text>
        </View>
      </View>

      {/* Level Filter */}
      {renderLevelFilter()}

      {/* Units List */}
      <FlatList
        data={filteredUnits}
        keyExtractor={(item) => item.id}
        renderItem={renderUnit}
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Language Picker Modal */}
      <Modal transparent visible={showLangPicker} animationType="fade" onRequestClose={() => setShowLangPicker(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalOverlayBg} activeOpacity={1} onPress={() => setShowLangPicker(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandleBar} />
            <Text style={styles.modalTitle}>Choose Language</Text>
            <Text style={styles.modalSubtitle}>Switch between your target languages</Text>
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langOption, activeLang === lang.code && styles.langOptionActive]}
                onPress={() => switchLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.langOptionFlag}>{lang.flag}</Text>
                <Text style={[styles.langOptionText, activeLang === lang.code && styles.langOptionTextActive]}>
                  {lang.name}
                </Text>
                {activeLang === lang.code && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Premium Upgrade Modal */}
      <Modal transparent visible={showUpgradeModal} animationType="fade" onRequestClose={() => setShowUpgradeModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalOverlayBg} activeOpacity={1} onPress={() => setShowUpgradeModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandleBar} />
            <View style={styles.upgradeLockIcon}>
              <Ionicons name="lock-closed" size={32} color={Colors.gold} />
            </View>
            <Text style={styles.modalTitle}>Unlock Advanced Lessons</Text>
            <Text style={styles.modalSubtitle}>
              B2, C1, and C2 level lessons require a Plus subscription. Upgrade to access advanced grammar, vocabulary, and conversation practice.
            </Text>
            <View style={styles.upgradeBenefits}>
              {["Unlimited AI teacher hours", "All CEFR levels (A1-C2)", "Certificate exams", "Progress analytics"].map((b, i) => (
                <View key={i} style={styles.upgradeBenefitRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.upgradeBenefitText}>{b}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => { setShowUpgradeModal(false); router.push("/payment-setup" as any); }}
              activeOpacity={0.8}
            >
              <Ionicons name="rocket" size={18} color={Colors.primary} />
              <Text style={styles.upgradeBtnText}>Upgrade to Plus</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.upgradeDismiss} onPress={() => setShowUpgradeModal(false)}>
              <Text style={styles.upgradeDismissText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", backgroundColor: Colors.surfaceCard,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  testBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", backgroundColor: Colors.secondary + "20",
  },
  // Language Switcher
  langSwitcher: {
    flexDirection: "row", alignItems: "center", alignSelf: "center",
    backgroundColor: Colors.surfaceCard, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, gap: 6, marginBottom: Spacing.sm,
  },
  langSwitcherFlag: { fontSize: 18 },
  langSwitcherText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  // Curriculum Banner
  curriculumBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  bannerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  bannerFlag: { fontSize: 28 },
  bannerTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  bannerSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  // Stats
  statsBar: {
    flexDirection: "row", justifyContent: "space-around",
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceCard, marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md, marginBottom: Spacing.sm,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary },
  filterRow: {
    paddingHorizontal: Spacing.md,
    gap: 6, marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    backgroundColor: Colors.surfaceCard,
  },
  filterChipActive: { backgroundColor: Colors.secondary + "20" },
  filterChipText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textMuted },
  filterChipTextActive: { color: Colors.secondary },
  unitCard: {
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm, overflow: "hidden",
  },
  unitHeader: {
    flexDirection: "row", alignItems: "center", padding: Spacing.md, gap: Spacing.sm,
  },
  unitLevelBadge: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  unitLevelText: { fontSize: 12, fontWeight: "800" },
  unitInfo: { flex: 1 },
  unitTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  unitDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  unitProgressBar: {
    height: 4, backgroundColor: Colors.surfaceElevated, borderRadius: 2,
    marginTop: 6, overflow: "hidden",
  },
  unitProgressFill: { height: "100%", borderRadius: 2 },
  unitMeta: { alignItems: "center", gap: 2 },
  unitMetaText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textSecondary },
  lessonsList: {
    borderTopWidth: 1, borderTopColor: Colors.surfaceElevated,
    paddingVertical: Spacing.xs,
  },
  lessonRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  lessonLocked: { opacity: 0.5 },
  lessonIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center",
  },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  lessonDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  lessonMeta: { alignItems: "flex-end" },
  lessonDuration: { fontSize: 10, color: Colors.textMuted },
  lessonXp: { fontSize: 10, fontWeight: "700", color: Colors.secondary },
  visualModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 44,
    marginTop: -4,
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#6C63FF" + "12",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  visualModeBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6C63FF",
  },
  visualModeBtnTag: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6C63FF",
    backgroundColor: "#6C63FF" + "20",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  // Modals
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalOverlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: { backgroundColor: Colors.surfaceCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, alignItems: "center" },
  modalHandleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: 20 },
  modalTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginBottom: 8 },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 20, paddingHorizontal: 16 },
  // Language picker options
  langOption: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
    width: "100%", marginBottom: 4,
  },
  langOptionActive: { backgroundColor: Colors.secondary + "15" },
  langOptionFlag: { fontSize: 24 },
  langOptionText: { flex: 1, fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  langOptionTextActive: { color: Colors.secondary },
  // Upgrade modal
  upgradeLockIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.gold + "15", borderWidth: 2, borderColor: Colors.gold + "40", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  upgradeBenefits: { width: "100%", gap: 8, marginBottom: 24 },
  upgradeBenefitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  upgradeBenefitText: { fontSize: FontSize.sm, color: Colors.textPrimary },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.gold, paddingVertical: 14, paddingHorizontal: 32, borderRadius: BorderRadius.lg, width: "100%", marginBottom: 12 },
  upgradeBtnText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.primary },
  upgradeDismiss: { paddingVertical: 8 },
  upgradeDismissText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
