import { useEffect, useState, useCallback, useRef } from "react";
import { Text, View, ScrollView, Pressable, StyleSheet, Dimensions, Share, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 64;
const CARD_HEIGHT = CARD_WIDTH * (16 / 9); // Instagram story ratio

type CardStyle = "vocab" | "cultural" | "slang" | "quote" | "challenge";

interface CardData {
  style: CardStyle;
  title: string;
  subtitle: string;
  mainText: string;
  secondaryText: string;
  footer: string;
  emoji: string;
  gradient: [string, string];
}

const CARD_STYLES: { id: CardStyle; label: string; icon: string }[] = [
  { id: "vocab", label: "Vocab Card", icon: "book-outline" },
  { id: "cultural", label: "Cultural Fact", icon: "earth-outline" },
  { id: "slang", label: "Slang Spotlight", icon: "chatbubble-ellipses-outline" },
  { id: "quote", label: "Daily Quote", icon: "text-outline" },
  { id: "challenge", label: "Challenge", icon: "trophy-outline" },
];

const GRADIENT_PRESETS: [string, string][] = [
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#a18cd1", "#fbc2eb"],
  ["#fccb90", "#d57eeb"],
  ["#30cfd0", "#330867"],
];

export default function ShareCardGeneratorScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ word?: string; meaning?: string; culturalFact?: string; dialect?: string }>();
  
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>("vocab");
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [gradientIndex, setGradientIndex] = useState(0);
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [nativeLanguage, setNativeLanguage] = useState("English");

  useEffect(() => {
    loadLanguages();
  }, []);

  useEffect(() => {
    generateCard(selectedStyle);
  }, [selectedStyle, gradientIndex, params.word]);

  const loadLanguages = async () => {
    try {
      const target = await AsyncStorage.getItem("@target_language");
      const native = await AsyncStorage.getItem("@native_language");
      if (target) setTargetLanguage(target);
      if (native) setNativeLanguage(native);
    } catch {}
  };

  const generateCard = (style: CardStyle) => {
    const gradient = GRADIENT_PRESETS[gradientIndex % GRADIENT_PRESETS.length];
    
    switch (style) {
      case "vocab":
        setCardData({
          style,
          title: "Word of the Day",
          subtitle: `${targetLanguage} → ${nativeLanguage}`,
          mainText: params.word || "Madrugada",
          secondaryText: params.meaning || "The early hours before dawn; that magical time between night and morning",
          footer: "ConnectWorld AI • Learn with culture",
          emoji: "📚",
          gradient,
        });
        break;
      case "cultural":
        setCardData({
          style,
          title: "Cultural Fact",
          subtitle: params.dialect || targetLanguage,
          mainText: params.culturalFact || "In Dominican Republic, 'vaina' can mean literally anything — it's the ultimate context word.",
          secondaryText: "Swipe up to learn more →",
          footer: "ConnectWorld AI • Culture meets language",
          emoji: "🌍",
          gradient,
        });
        break;
      case "slang":
        setCardData({
          style,
          title: "Slang Spotlight",
          subtitle: params.dialect || `${targetLanguage} Street Talk`,
          mainText: params.word || "¿Qué lo que?",
          secondaryText: params.meaning || "What's up? (Dominican greeting)",
          footer: "ConnectWorld AI • Real talk, real language",
          emoji: "🔥",
          gradient,
        });
        break;
      case "quote":
        setCardData({
          style,
          title: "Daily Motivation",
          subtitle: "Bilingual Wisdom",
          mainText: "\"El que no arriesga, no gana\"",
          secondaryText: "\"Nothing ventured, nothing gained\"",
          footer: "ConnectWorld AI • Think in two languages",
          emoji: "💭",
          gradient,
        });
        break;
      case "challenge":
        setCardData({
          style,
          title: "Weekly Challenge",
          subtitle: `Can you guess the dialect?`,
          mainText: params.word || "¡Wepa!",
          secondaryText: "Which country uses this expression? Tag a friend who knows! 👇",
          footer: "ConnectWorld AI • Test your knowledge",
          emoji: "🏆",
          gradient,
        });
        break;
    }
  };

  const cycleGradient = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setGradientIndex((prev) => (prev + 1) % GRADIENT_PRESETS.length);
  };

  const shareCard = async () => {
    if (!cardData) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const shareText = buildShareText(cardData);
    
    try {
      await Share.share({
        message: shareText,
        title: cardData.title,
      });
    } catch {}
  };

  const buildShareText = (data: CardData): string => {
    const lines = [
      `${data.emoji} ${data.title}`,
      `━━━━━━━━━━━━━━━`,
      "",
      data.mainText,
      "",
      data.secondaryText,
      "",
      `━━━━━━━━━━━━━━━`,
      data.footer,
      "",
      "#ConnectWorldAI #LanguageLearning #Bilingual",
    ];

    if (data.style === "slang" || data.style === "vocab") {
      lines.push(`#${targetLanguage} #LearnLanguages`);
    }
    if (data.style === "cultural") {
      lines.push("#CulturalImmersion #Heritage");
    }

    return lines.join("\n");
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Share Card
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Style Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.styleSelector}
        >
          {CARD_STYLES.map((style) => (
            <Pressable
              key={style.id}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedStyle(style.id);
              }}
              style={({ pressed }) => [
                styles.styleBtn,
                {
                  backgroundColor: selectedStyle === style.id ? colors.primary : colors.surface,
                  borderColor: selectedStyle === style.id ? colors.primary : colors.border,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons
                name={style.icon as any}
                size={16}
                color={selectedStyle === style.id ? "#fff" : colors.muted}
              />
              <Text
                style={[
                  styles.styleBtnText,
                  { color: selectedStyle === style.id ? "#fff" : colors.muted },
                ]}
              >
                {style.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Card Preview */}
        {cardData && (
          <View style={styles.cardContainer}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: cardData.gradient[0],
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                },
              ]}
            >
              {/* Card Content */}
              <View style={styles.cardInner}>
                <Text style={styles.cardEmoji}>{cardData.emoji}</Text>
                <Text style={styles.cardTitle}>{cardData.title}</Text>
                <Text style={styles.cardSubtitle}>{cardData.subtitle}</Text>
                
                <View style={styles.cardMainSection}>
                  <Text style={styles.cardMainText}>{cardData.mainText}</Text>
                  <Text style={styles.cardSecondaryText}>{cardData.secondaryText}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>{cardData.footer}</Text>
                </View>
              </View>

              {/* Gradient overlay effect */}
              <View
                style={[
                  styles.gradientOverlay,
                  { backgroundColor: cardData.gradient[1], opacity: 0.3 },
                ]}
              />
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={cycleGradient}
            style={({ pressed }) => [
              styles.controlBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
            <Text style={[styles.controlBtnText, { color: colors.foreground }]}>
              Change Color
            </Text>
          </Pressable>

          <Pressable
            onPress={shareCard}
            style={({ pressed }) => [
              styles.shareBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text style={styles.shareBtnText}>Share to Social</Text>
          </Pressable>
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: 16 }]}>
          <Text style={[styles.tipsTitle, { color: colors.foreground }]}>
            📱 Sharing Tips
          </Text>
          <Text style={[styles.tipsText, { color: colors.muted }]}>
            • Instagram Stories: Screenshot the card preview above{"\n"}
            • TikTok: Use the text as a caption for your language learning video{"\n"}
            • WhatsApp/iMessage: Tap "Share to Social" to send the formatted text{"\n"}
            • Add hashtags like #ConnectWorldAI to join the community
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  styleSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  styleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  styleBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },
  cardContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  cardInner: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    zIndex: 1,
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  cardMainSection: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  cardMainText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    lineHeight: 34,
  },
  cardSecondaryText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 22,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 12,
  },
  cardFooterText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  controls: {
    flexDirection: "row",
    paddingHorizontal: 32,
    gap: 12,
    marginBottom: 20,
  },
  controlBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  controlBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  tipsCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 22,
  },
});
