import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useI18n, SUPPORTED_LANGUAGES } from "@/lib/i18n";

const RECOMMENDATION_DISMISSED_KEY = "@lang_rec_dismissed";
const RECOMMENDATION_COOLDOWN_KEY = "@lang_rec_cooldown";
const COOLDOWN_DAYS = 7;

// CEFR level order for comparison
const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Minimum CEFR level to trigger recommendation (B1 = intermediate)
const MIN_LEVEL_FOR_RECOMMENDATION = "B1";

export function LanguageRecommendation() {
  const { t, language, setLanguage } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const [targetLangName, setTargetLangName] = useState<string>("");
  const [targetLangFlag, setTargetLangFlag] = useState<string>("");
  const [cefrLevel, setCefrLevel] = useState<string | null>(null);

  useEffect(() => {
    checkRecommendation();
  }, []);

  const checkRecommendation = async () => {
    try {
      // Check if permanently dismissed
      const dismissed = await AsyncStorage.getItem(RECOMMENDATION_DISMISSED_KEY);
      if (dismissed === "true") return;

      // Check cooldown
      const cooldownStr = await AsyncStorage.getItem(RECOMMENDATION_COOLDOWN_KEY);
      if (cooldownStr) {
        const cooldownDate = new Date(cooldownStr);
        const now = new Date();
        const diffDays = (now.getTime() - cooldownDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < COOLDOWN_DAYS) return;
      }

      // Get user's target language and CEFR level
      const target = await AsyncStorage.getItem("@target_language");
      const level = await AsyncStorage.getItem("@cefr_level");

      if (!target || !level) return;

      // Check if level is high enough (B1 or above)
      const levelIdx = CEFR_ORDER.indexOf(level);
      const minIdx = CEFR_ORDER.indexOf(MIN_LEVEL_FOR_RECOMMENDATION);
      if (levelIdx < minIdx) return;

      // Check if UI is already in the target language
      if (language === target) return;

      // Check if target language is supported in our i18n system
      const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === target);
      if (!langInfo) return;

      setTargetLang(target);
      setTargetLangName(langInfo.nativeName || langInfo.name);
      setTargetLangFlag(langInfo.flag);
      setCefrLevel(level);
      setShowModal(true);
    } catch {
      // Silently fail
    }
  };

  const handleAccept = async () => {
    if (targetLang) {
      setLanguage(targetLang as any);
    }
    setShowModal(false);
  };

  const handleLater = async () => {
    await AsyncStorage.setItem(RECOMMENDATION_COOLDOWN_KEY, new Date().toISOString());
    setShowModal(false);
  };

  const handleDismiss = async () => {
    await AsyncStorage.setItem(RECOMMENDATION_DISMISSED_KEY, "true");
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={handleLater}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={28} color="#FFD700" />
            </View>
            <Text style={styles.title}>Ready for Immersion?</Text>
            <Text style={styles.subtitle}>
              You've reached <Text style={styles.levelHighlight}>{cefrLevel}</Text> — switch your app to {targetLangName} for deeper learning
            </Text>
          </View>

          {/* Language preview */}
          <View style={styles.langPreview}>
            <Text style={styles.langFlag}>{targetLangFlag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.langName}>{targetLangName}</Text>
              <Text style={styles.langLevel}>CEFR Level: {cefrLevel}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{cefrLevel}</Text>
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.benefits}>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.benefitText}>All menus, buttons, and labels in {targetLangName}</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.benefitText}>Daily passive exposure accelerates fluency</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.benefitText}>Switch back anytime in Settings</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.8}>
              <Ionicons name="language" size={18} color="#fff" />
              <Text style={styles.acceptText}>Switch Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.laterBtn} onPress={handleLater} activeOpacity={0.7}>
              <Text style={styles.laterText}>Remind Me Later</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.7}>
              <Text style={styles.dismissText}>Don't Ask Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: width - 48,
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,215,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 20,
  },
  levelHighlight: {
    color: "#FFD700",
    fontWeight: "700",
  },
  langPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.08)",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  langFlag: {
    fontSize: 32,
  },
  langName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  langLevel: {
    fontSize: 12,
    color: "#FFD700",
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFD700",
  },
  benefits: {
    marginBottom: 20,
    gap: 8,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
    color: "#ccc",
    flex: 1,
  },
  actions: {
    gap: 10,
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a7ea4",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  acceptText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  laterBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  laterText: {
    fontSize: 14,
    color: "#aaa",
  },
  dismissBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  dismissText: {
    fontSize: 12,
    color: "#666",
  },
});
