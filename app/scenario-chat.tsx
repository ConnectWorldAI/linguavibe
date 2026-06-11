import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated as RNAnimated,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

type DialogueOption = {
  id: string;
  text: string;
  translation: string;
  quality: "perfect" | "good" | "okay" | "wrong";
  points: number;
};

type DialogueTurn = {
  id: string;
  speaker: "character" | "user" | "system";
  text: string;
  translation?: string;
  culturalNote?: string;
  slangNote?: string;
  options?: DialogueOption[];
  selectedOption?: string;
};

type ScenarioData = {
  id: string;
  title: string;
  character: string;
  characterEmoji: string;
  characterBio: string;
  dialect: string;
  setting: string;
  dialogue: DialogueTurn[];
};

// Rich scenario data with branching conversations
// Import additional city scenarios
import { CITY_SCENARIOS } from "@/data/city-scenarios";
import { useChatWallpaper } from "@/hooks/use-chat-wallpaper";
import { ChatWallpaperBackground } from "@/components/chat-wallpaper-background";

const SCENARIOS: Record<string, ScenarioData> = {
  ...CITY_SCENARIOS,
  "tapas-bar": {
    id: "tapas-bar",
    title: "Ordering Tapas Like a Local",
    character: "Carlos",
    characterEmoji: "👨‍🍳",
    characterBio: "45-year-old tapas bar owner in the Gothic Quarter. Third-generation bartender. Speaks fast Castilian with Barcelona slang.",
    dialect: "Castilian Spanish (Barcelona accent)",
    setting: "A tiny standing-only tapas bar on a narrow Gothic Quarter street. It's 9:30pm, the bar is packed, and there's no menu — you have to ask.",
    dialogue: [
      {
        id: "1", speaker: "system", text: "You push through a beaded curtain into a packed tapas bar. There's no menu board. A mustached man behind the counter nods at you.",
      },
      {
        id: "2", speaker: "character", text: "¡Buenas! ¿Qué te pongo, guapo?",
        translation: "Hey! What can I get you, handsome?",
        slangNote: "'Guapo/a' — Barcelonians use this casually for everyone, not just attractive people. It's like 'mate' or 'buddy'.",
      },
      {
        id: "3", speaker: "user", text: "", options: [
          { id: "a", text: "Hola, ¿qué tapas tienen hoy?", translation: "Hi, what tapas do you have today?", quality: "perfect", points: 10 },
          { id: "b", text: "Una cerveza, por favor", translation: "A beer, please", quality: "good", points: 7 },
          { id: "c", text: "I would like some tapas please", translation: "(English — not ideal!)", quality: "okay", points: 3 },
          { id: "d", text: "Quiero el menú", translation: "I want the menu", quality: "wrong", points: 1 },
        ],
      },
      {
        id: "4", speaker: "character", text: "Hoy tenemos patatas bravas, boquerones en vinagre, y la bomba de la Barceloneta. ¡La bomba está de muerte hoy!",
        translation: "Today we have spicy potatoes, anchovies in vinegar, and the Barceloneta bomb (potato croquette). The bomb is to die for today!",
        slangNote: "'Está de muerte' — literally 'it's of death' but means 'it's amazing/killer'. Very common in Barcelona bars.",
        culturalNote: "In Barcelona, the 'bomba' is a famous potato ball filled with meat, covered in spicy sauce. It originated in Barceloneta neighborhood.",
      },
      {
        id: "5", speaker: "user", text: "", options: [
          { id: "a", text: "¡Ponme una bomba y unas bravas! ¿Y una caña también?", translation: "Give me a bomb and some bravas! And a small beer too?", quality: "perfect", points: 10 },
          { id: "b", text: "La bomba, por favor. Y una cerveza.", translation: "The bomb, please. And a beer.", quality: "good", points: 7 },
          { id: "c", text: "¿Qué es la bomba?", translation: "What is the bomb?", quality: "good", points: 6 },
          { id: "d", text: "No entiendo. ¿Puede repetir?", translation: "I don't understand. Can you repeat?", quality: "okay", points: 4 },
        ],
      },
      {
        id: "6", speaker: "character", text: "¡Marchando! Oye, ¿de dónde eres? Se nota que no eres de aquí, pero tu español mola.",
        translation: "Coming right up! Hey, where are you from? I can tell you're not from here, but your Spanish is cool.",
        slangNote: "'Mola' — means 'cool/awesome' in Spain. Very casual. 'Marchando' = 'coming right up' (literally 'marching').",
      },
      {
        id: "7", speaker: "user", text: "", options: [
          { id: "a", text: "Soy de Estados Unidos. Estoy aprendiendo español con una app que mola mucho.", translation: "I'm from the US. I'm learning Spanish with a really cool app.", quality: "perfect", points: 10 },
          { id: "b", text: "Soy americano. Estoy de vacaciones.", translation: "I'm American. I'm on vacation.", quality: "good", points: 7 },
          { id: "c", text: "De América. Gracias.", translation: "From America. Thanks.", quality: "okay", points: 5 },
          { id: "d", text: "Thank you, I'm from the US.", translation: "(Switching to English)", quality: "wrong", points: 2 },
        ],
      },
      {
        id: "8", speaker: "character", text: "¡Qué guay! Mira, te voy a poner un pincho de tortilla de la casa, invita Carlos. ¡Bienvenido a Barcelona, tío!",
        translation: "How cool! Look, I'm going to give you a slice of house tortilla, on Carlos. Welcome to Barcelona, dude!",
        slangNote: "'Tío/tía' — literally 'uncle/aunt' but used like 'dude/bro' in casual Spanish. 'Invita Carlos' = 'Carlos is treating' (third person = himself).",
        culturalNote: "Bartenders in Barcelona often give free 'pinchos' (small bites) to regulars or friendly tourists. It's a sign they like you!",
      },
      {
        id: "9", speaker: "user", text: "", options: [
          { id: "a", text: "¡Qué majo eres, Carlos! Muchas gracias, tío. ¡Esto es genial!", translation: "How nice you are, Carlos! Thanks a lot, dude. This is great!", quality: "perfect", points: 10 },
          { id: "b", text: "¡Gracias! Eres muy amable.", translation: "Thanks! You're very kind.", quality: "good", points: 7 },
          { id: "c", text: "Gracias, Carlos.", translation: "Thanks, Carlos.", quality: "okay", points: 5 },
          { id: "d", text: "Thank you so much!", translation: "(English again)", quality: "wrong", points: 2 },
        ],
      },
      {
        id: "10", speaker: "system", text: "Carlos slides a golden slice of Spanish tortilla across the bar with a wink. The patatas bravas arrive sizzling. You've made your first Barcelona friend.",
      },
    ],
  },
  "ramen-shop": {
    id: "ramen-shop",
    title: "Ordering at a Ticket Machine Ramen Shop",
    character: "Tanaka-san",
    characterEmoji: "👨‍🍳",
    characterBio: "58-year-old ramen master who's been making tonkotsu broth for 30 years. Speaks gruff Kanto Japanese with minimal words.",
    dialect: "Standard Japanese (gruff/masculine)",
    setting: "A tiny 8-seat ramen counter in Shibuya. There's a ticket machine at the entrance with buttons covered in kanji. The chef barely looks up from his broth.",
    dialogue: [
      {
        id: "1", speaker: "system", text: "You enter a narrow ramen shop. A vending machine with dozens of buttons blocks the entrance. All labels are in kanji. A stern-looking chef glances at you from behind the counter.",
      },
      {
        id: "2", speaker: "character", text: "いらっしゃい。券売機で食券を買ってね。",
        translation: "Welcome. Buy a meal ticket from the machine.",
        culturalNote: "In Japan, many ramen shops use ticket machines (券売機 kenbaiki). You buy a ticket, hand it to the chef, and sit down. No verbal ordering needed.",
      },
      {
        id: "3", speaker: "user", text: "", options: [
          { id: "a", text: "すみません、おすすめは何ですか？", translation: "Excuse me, what do you recommend?", quality: "perfect", points: 10 },
          { id: "b", text: "えっと...日本語が少しだけ...", translation: "Um... only a little Japanese...", quality: "good", points: 6 },
          { id: "c", text: "English menu?", translation: "(Asking in English)", quality: "okay", points: 3 },
          { id: "d", text: "*stare at machine confused*", translation: "(Just standing there)", quality: "wrong", points: 1 },
        ],
      },
      {
        id: "4", speaker: "character", text: "うちの一番は特製とんこつ。上のボタン、左から二番目。味玉つけるなら、その隣。",
        translation: "Our best is the special tonkotsu. Top row, second from left. If you want a seasoned egg, it's the one next to it.",
        slangNote: "'うち' (uchi) — means 'our place/my shop'. Very casual and warm way for shop owners to refer to their establishment.",
      },
      {
        id: "5", speaker: "user", text: "", options: [
          { id: "a", text: "特製とんこつと味玉、お願いします！", translation: "Special tonkotsu and seasoned egg, please!", quality: "perfect", points: 10 },
          { id: "b", text: "とんこつ、お願いします。", translation: "Tonkotsu, please.", quality: "good", points: 7 },
          { id: "c", text: "これ？(pointing)", translation: "This one? (pointing)", quality: "okay", points: 5 },
          { id: "d", text: "I'll have the pork one", translation: "(English)", quality: "wrong", points: 2 },
        ],
      },
      {
        id: "6", speaker: "character", text: "麺の硬さは？バリカタ、カタ、普通？",
        translation: "Noodle firmness? Extra firm, firm, or regular?",
        culturalNote: "Choosing noodle firmness is essential at ramen shops. 'バリカタ' (barikata = extra firm) is the Hakata/Fukuoka style and considered the 'pro' choice.",
        slangNote: "'バリカタ' comes from Fukuoka dialect. 'バリ' (bari) means 'very/super' in Hakata-ben.",
      },
      {
        id: "7", speaker: "user", text: "", options: [
          { id: "a", text: "バリカタでお願いします！", translation: "Extra firm, please!", quality: "perfect", points: 10 },
          { id: "b", text: "カタで。", translation: "Firm.", quality: "good", points: 7 },
          { id: "c", text: "普通で大丈夫です。", translation: "Regular is fine.", quality: "good", points: 6 },
          { id: "d", text: "Um... normal?", translation: "(Unsure)", quality: "okay", points: 4 },
        ],
      },
      {
        id: "8", speaker: "character", text: "はい、バリカタ一丁！...お客さん、日本語上手だね。どこで覚えたの？",
        translation: "One extra firm, coming up! ...Hey customer, your Japanese is good. Where'd you learn?",
        slangNote: "'一丁' (itchō) — counter word used by chefs meaning 'one order, coming up!' Very professional kitchen language.",
      },
      {
        id: "9", speaker: "user", text: "", options: [
          { id: "a", text: "アプリで勉強してます！旅行で使いたくて。", translation: "I'm studying with an app! I wanted to use it for travel.", quality: "perfect", points: 10 },
          { id: "b", text: "独学です。まだまだですけど。", translation: "Self-taught. Still have a long way to go though.", quality: "perfect", points: 10 },
          { id: "c", text: "ありがとうございます。少しだけ。", translation: "Thank you. Just a little.", quality: "good", points: 7 },
          { id: "d", text: "Thank you!", translation: "(English)", quality: "okay", points: 4 },
        ],
      },
      {
        id: "10", speaker: "character", text: "いいね。替え玉知ってる？麺おかわり150円。腹減ったら言ってね。",
        translation: "Nice. You know kaedama? Extra noodles for 150 yen. Tell me if you're still hungry.",
        culturalNote: "替え玉 (kaedama) is a ramen-specific term for ordering extra noodles in your remaining broth. It's much cheaper than a full bowl and very common in tonkotsu shops.",
      },
      {
        id: "11", speaker: "system", text: "Tanaka-san cracks a rare smile and slides a steaming bowl of rich, milky tonkotsu ramen across the counter. The egg is perfectly soft-boiled. You've earned the respect of a ramen master.",
      },
    ],
  },
  "wine-bar": {
    id: "wine-bar",
    title: "Wine Tasting at a Cave à Vin",
    character: "Sommelier Pierre",
    characterEmoji: "🍷",
    characterBio: "32-year-old sommelier with a man-bun and strong opinions about natural wine. Speaks rapid Parisian French with wine jargon.",
    dialect: "Parisian French (casual/hip)",
    setting: "A dimly lit wine cave in Montmartre with exposed stone walls. Candles flicker. Pierre is polishing glasses behind a small wooden counter.",
    dialogue: [
      {
        id: "1", speaker: "system", text: "You descend stone steps into a cozy wine cave. The smell of aged oak fills the air. A young sommelier with a man-bun looks up and smiles.",
      },
      {
        id: "2", speaker: "character", text: "Bonsoir ! Bienvenue dans notre petite cave. C'est votre première fois ici ?",
        translation: "Good evening! Welcome to our little cave. Is this your first time here?",
        culturalNote: "In France, ALWAYS greet with 'Bonsoir' (good evening) after 6pm. Using 'Bonjour' at night marks you as a tourist immediately.",
      },
      {
        id: "3", speaker: "user", text: "", options: [
          { id: "a", text: "Bonsoir ! Oui, c'est ma première fois. On m'a dit que vos vins naturels sont incroyables.", translation: "Good evening! Yes, first time. I was told your natural wines are incredible.", quality: "perfect", points: 10 },
          { id: "b", text: "Bonsoir. Oui, première fois. Je voudrais goûter du vin.", translation: "Good evening. Yes, first time. I'd like to taste some wine.", quality: "good", points: 7 },
          { id: "c", text: "Bonjour, oui.", translation: "Hello, yes. (Wrong time greeting!)", quality: "okay", points: 4 },
          { id: "d", text: "Hi, do you speak English?", translation: "(English — Pierre will judge you)", quality: "wrong", points: 1 },
        ],
      },
      {
        id: "4", speaker: "character", text: "Ah, vous aimez le vin nat' ! Parfait. Vous préférez quelque chose de léger et fruité, ou plutôt charpenté et complexe ?",
        translation: "Ah, you like natural wine! Perfect. Do you prefer something light and fruity, or rather full-bodied and complex?",
        slangNote: "'Vin nat'' — abbreviation of 'vin naturel' (natural wine). Very trendy Parisian slang. 'Charpenté' literally means 'built like a frame' — used for bold wines.",
      },
      {
        id: "5", speaker: "user", text: "", options: [
          { id: "a", text: "J'aimerais quelque chose de charpenté. Un rouge avec du caractère, s'il vous plaît.", translation: "I'd like something full-bodied. A red with character, please.", quality: "perfect", points: 10 },
          { id: "b", text: "Un rouge, s'il vous plaît. Pas trop léger.", translation: "A red, please. Not too light.", quality: "good", points: 7 },
          { id: "c", text: "Je ne sais pas... vous choisissez ?", translation: "I don't know... you choose?", quality: "good", points: 6 },
          { id: "d", text: "Red wine please.", translation: "(English)", quality: "wrong", points: 2 },
        ],
      },
      {
        id: "6", speaker: "character", text: "J'ai exactement ce qu'il vous faut. Un Côtes du Rhône, cépage Grenache, élevé en amphore. C'est une petite pépite. Goûtez-moi ça.",
        translation: "I have exactly what you need. A Côtes du Rhône, Grenache grape, aged in amphora. It's a little gem. Taste this for me.",
        slangNote: "'Pépite' — literally 'nugget' (as in gold nugget). Used to mean 'hidden gem/treasure'. Very common in Parisian slang.",
        culturalNote: "Amphora-aged wines are trendy in natural wine circles. The clay vessel gives a unique earthy character without the oak flavor.",
      },
      {
        id: "7", speaker: "user", text: "", options: [
          { id: "a", text: "Mmm, c'est magnifique ! Je sens des notes de cerise et un peu d'épices. Il est vraiment charpenté.", translation: "Mmm, it's magnificent! I taste notes of cherry and a bit of spice. It's really full-bodied.", quality: "perfect", points: 10 },
          { id: "b", text: "C'est très bon ! J'aime beaucoup.", translation: "It's very good! I like it a lot.", quality: "good", points: 7 },
          { id: "c", text: "Oui, c'est bon.", translation: "Yes, it's good.", quality: "okay", points: 5 },
          { id: "d", text: "Tastes great!", translation: "(English)", quality: "wrong", points: 2 },
        ],
      },
      {
        id: "8", speaker: "character", text: "Vous avez le palais ! Allez, je vous sers un deuxième verre — celui-là c'est cadeau. Entre amateurs de bon vin, on se serre les coudes.",
        translation: "You have a palate! Come on, I'll pour you a second glass — this one's on the house. Among wine lovers, we stick together.",
        slangNote: "'Se serrer les coudes' — literally 'to squeeze elbows together', means 'to stick together/support each other'. Beautiful French expression.",
      },
      {
        id: "9", speaker: "system", text: "Pierre pours you a second glass with a conspiratorial grin. You've earned the respect of a Parisian sommelier — no small feat. The candlelight catches the deep ruby of the wine as you settle into the evening.",
      },
    ],
  },
};

// Default scenario for unknown IDs
const DEFAULT_SCENARIO: ScenarioData = {
  id: "default",
  title: "Practice Conversation",
  character: "Local",
  characterEmoji: "🗣️",
  characterBio: "A friendly local eager to help you practice.",
  dialect: "Standard",
  setting: "A casual setting perfect for language practice.",
  dialogue: [
    { id: "1", speaker: "system", text: "You approach a friendly local who seems happy to chat." },
    { id: "2", speaker: "character", text: "¡Hola! ¿Cómo estás?", translation: "Hello! How are you?" },
    {
      id: "3", speaker: "user", text: "", options: [
        { id: "a", text: "¡Hola! Estoy bien, gracias. ¿Y tú?", translation: "Hi! I'm good, thanks. And you?", quality: "perfect", points: 10 },
        { id: "b", text: "Bien, gracias.", translation: "Good, thanks.", quality: "good", points: 7 },
        { id: "c", text: "Hello!", translation: "(English)", quality: "okay", points: 4 },
        { id: "d", text: "...", translation: "(Silence)", quality: "wrong", points: 1 },
      ],
    },
    { id: "4", speaker: "character", text: "¡Muy bien! Me alegro. ¿De dónde eres?", translation: "Very good! I'm glad. Where are you from?" },
    { id: "5", speaker: "system", text: "The conversation continues warmly. You've made a connection!" },
  ],
};

export default function ScenarioChatScreen() {
  const { theme: chatWallpaper } = useChatWallpaper("scenario-chat");

  const params = useLocalSearchParams<{
    scenarioId?: string;
    scenarioTitle?: string;
    characterName?: string;
    characterEmoji?: string;
    city?: string;
    neighborhood?: string;
    language?: string;
  }>();

  const scenario = SCENARIOS[params.scenarioId || ""] || DEFAULT_SCENARIO;
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showCulturalNote, setShowCulturalNote] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [currentTurnIndex]);

  const visibleTurns = scenario.dialogue.slice(0, currentTurnIndex + 1);
  const currentTurn = scenario.dialogue[currentTurnIndex];
  const isLastTurn = currentTurnIndex >= scenario.dialogue.length - 1;

  const handleOptionSelect = (turn: DialogueTurn, option: DialogueOption) => {
    if (Platform.OS !== "web") {
      if (option.quality === "perfect") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (option.quality === "wrong") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedOptions({ ...selectedOptions, [turn.id]: option.id });
    setTotalScore(totalScore + option.points);
    setMaxScore(maxScore + 10);

    // Advance to next turn
    setTimeout(() => {
      if (currentTurnIndex < scenario.dialogue.length - 1) {
        setCurrentTurnIndex(currentTurnIndex + 1);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        setShowResult(true);
      }
    }, 600);
  };

  const advanceTurn = () => {
    if (currentTurnIndex < scenario.dialogue.length - 1) {
      setCurrentTurnIndex(currentTurnIndex + 1);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } else {
      setShowResult(true);
    }
  };

  const getScoreGrade = () => {
    const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    if (pct >= 90) return { grade: "A+", label: "Native-Level!", color: Colors.success, emoji: "🌟" };
    if (pct >= 75) return { grade: "A", label: "Impressive!", color: Colors.success, emoji: "✨" };
    if (pct >= 60) return { grade: "B", label: "Good Effort!", color: Colors.gold, emoji: "👍" };
    if (pct >= 40) return { grade: "C", label: "Keep Practicing", color: Colors.warning, emoji: "💪" };
    return { grade: "D", label: "Try Again", color: Colors.accent, emoji: "📚" };
  };

  const getOptionColor = (quality: string) => {
    switch (quality) {
      case "perfect": return Colors.success;
      case "good": return Colors.glow;
      case "okay": return Colors.warning;
      case "wrong": return Colors.accent;
      default: return Colors.textMuted;
    }
  };

  if (showResult) {
    const grade = getScoreGrade();
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.resultEmoji}>{grade.emoji}</Text>
          <Text style={[styles.resultGrade, { color: grade.color }]}>{grade.grade}</Text>
          <Text style={styles.resultLabel}>{grade.label}</Text>
          <Text style={styles.resultScore}>{totalScore} / {maxScore} points</Text>

          <View style={styles.resultCard}>
            <Text style={styles.resultCardTitle}>Conversation with {scenario.character} {scenario.characterEmoji}</Text>
            <Text style={styles.resultCardSubtitle}>{params.city} · {params.neighborhood}</Text>
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={[styles.resultBtn, { backgroundColor: Colors.secondary }]}
              onPress={() => {
                setCurrentTurnIndex(0);
                setSelectedOptions({});
                setTotalScore(0);
                setMaxScore(0);
                setShowResult(false);
              }}
            >
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.resultBtnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultBtn, { backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
              <Text style={[styles.resultBtnText, { color: Colors.textPrimary }]}>Back to City</Text>
            </TouchableOpacity>
          </View>

          {/* Tips based on performance */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Tips for Next Time</Text>
            {totalScore / maxScore < 0.7 && (
              <Text style={styles.tipItem}>• Try using local slang — it shows cultural awareness</Text>
            )}
            <Text style={styles.tipItem}>• Stay in the target language even when unsure</Text>
            <Text style={styles.tipItem}>• Mirror the formality level of the other speaker</Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ChatWallpaperBackground theme={chatWallpaper} fallbackColor="#0A1628">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{scenario.character} {scenario.characterEmoji}</Text>
          <Text style={styles.headerSubtitle}>{scenario.title}</Text>
        </View>
        <View style={styles.scoreChip}>
          <Ionicons name="star" size={12} color={Colors.gold} />
          <Text style={styles.scoreText}>{totalScore}</Text>
        </View>
      </View>

      {/* Character Bio Bar */}
      <View style={styles.bioBar}>
        <Text style={styles.bioText} numberOfLines={2}>{scenario.characterBio}</Text>
        <Text style={styles.dialectText}>🗣️ {scenario.dialect}</Text>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Setting Description */}
          <View style={styles.settingCard}>
            <Ionicons name="location" size={14} color={Colors.gold} />
            <Text style={styles.settingText}>{scenario.setting}</Text>
          </View>

          {/* Dialogue Turns */}
          {visibleTurns.map((turn, index) => {
            if (turn.speaker === "system") {
              return (
                <View key={turn.id} style={styles.systemBubble}>
                  <Text style={styles.systemText}>{turn.text}</Text>
                  {!isLastTurn && index === currentTurnIndex && (
                    <TouchableOpacity style={styles.continueBtn} onPress={advanceTurn}>
                      <Text style={styles.continueBtnText}>Continue</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.secondary} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }

            if (turn.speaker === "character") {
              return (
                <View key={turn.id}>
                  <View style={styles.characterBubble}>
                    <View style={styles.bubbleAvatar}>
                      <Text style={{ fontSize: 20 }}>{scenario.characterEmoji}</Text>
                    </View>
                    <View style={styles.bubbleContent}>
                      <Text style={styles.characterText}>{turn.text}</Text>
                      {turn.translation && (
                        <Text style={styles.translationText}>↳ {turn.translation}</Text>
                      )}
                    </View>
                  </View>
                  {/* Cultural/Slang Notes */}
                  {(turn.culturalNote || turn.slangNote) && (
                    <View style={styles.noteContainer}>
                      {turn.slangNote && (
                        <View style={styles.slangNote}>
                          <Text style={styles.noteLabel}>🗣️ Slang</Text>
                          <Text style={styles.noteText}>{turn.slangNote}</Text>
                        </View>
                      )}
                      {turn.culturalNote && (
                        <View style={styles.culturalNote}>
                          <Text style={styles.noteLabel}>🌍 Culture</Text>
                          <Text style={styles.noteText}>{turn.culturalNote}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {index === currentTurnIndex && !turn.options && (
                    <TouchableOpacity style={styles.continueBtn} onPress={advanceTurn}>
                      <Text style={styles.continueBtnText}>Continue</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.secondary} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }

            if (turn.speaker === "user" && turn.options) {
              const selected = selectedOptions[turn.id];
              if (selected) {
                const chosenOption = turn.options.find(o => o.id === selected)!;
                return (
                  <View key={turn.id} style={styles.userBubbleContainer}>
                    <View style={[styles.userBubble, { borderColor: getOptionColor(chosenOption.quality) + "60" }]}>
                      <Text style={styles.userText}>{chosenOption.text}</Text>
                      <Text style={styles.userTranslation}>↳ {chosenOption.translation}</Text>
                      <View style={[styles.qualityBadge, { backgroundColor: getOptionColor(chosenOption.quality) + "20" }]}>
                        <Text style={[styles.qualityText, { color: getOptionColor(chosenOption.quality) }]}>
                          {chosenOption.quality === "perfect" ? "🌟 Perfect!" :
                           chosenOption.quality === "good" ? "✨ Good!" :
                           chosenOption.quality === "okay" ? "👍 Okay" : "❌ Try harder"}
                          {" "}+{chosenOption.points}pts
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }
              // Show options to pick
              if (index === currentTurnIndex) {
                return (
                  <View key={turn.id} style={styles.optionsContainer}>
                    <Text style={styles.optionsLabel}>Choose your response:</Text>
                    {turn.options.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={styles.optionBtn}
                        activeOpacity={0.7}
                        onPress={() => handleOptionSelect(turn, option)}
                      >
                        <Text style={styles.optionText}>{option.text}</Text>
                        <Text style={styles.optionTranslation}>{option.translation}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              }
            }

            return null;
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      </ChatWallpaperBackground>
</ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  headerSubtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  scoreChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.goldGlow, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: Colors.goldBorder },
  scoreText: { fontSize: 13, fontWeight: "700", color: Colors.gold },
  bioBar: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.surfaceCard, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  bioText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
  dialectText: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  chatArea: { flex: 1 },
  chatContent: { padding: 16 },
  settingCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: Colors.goldGlow, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.goldBorder },
  settingText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18, fontStyle: "italic" },
  systemBubble: { alignItems: "center", marginVertical: 12, paddingHorizontal: 20 },
  systemText: { fontSize: 13, color: Colors.textSecondary, textAlign: "center", lineHeight: 20, fontStyle: "italic" },
  continueBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: Colors.glowSubtle, borderWidth: 1, borderColor: Colors.glowBorder },
  continueBtnText: { fontSize: 12, fontWeight: "600", color: Colors.secondary },
  characterBubble: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4, maxWidth: "85%" },
  bubbleAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  bubbleContent: { flex: 1, backgroundColor: Colors.surfaceCard, borderRadius: 14, borderTopLeftRadius: 4, padding: 12, borderWidth: 1, borderColor: Colors.border },
  characterText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  translationText: { fontSize: 12, color: Colors.textMuted, marginTop: 6, fontStyle: "italic" },
  noteContainer: { marginLeft: 44, marginBottom: 12, gap: 6 },
  slangNote: { backgroundColor: Colors.glowSubtle, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.glowBorder },
  culturalNote: { backgroundColor: Colors.goldGlow, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.goldBorder },
  noteLabel: { fontSize: 11, fontWeight: "700", color: Colors.textSecondary, marginBottom: 4 },
  noteText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  userBubbleContainer: { alignItems: "flex-end", marginVertical: 8 },
  userBubble: { maxWidth: "80%", backgroundColor: Colors.surfaceElevated, borderRadius: 14, borderTopRightRadius: 4, padding: 12, borderWidth: 1 },
  userText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  userTranslation: { fontSize: 12, color: Colors.textMuted, marginTop: 4, fontStyle: "italic" },
  qualityBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  qualityText: { fontSize: 11, fontWeight: "700" },
  optionsContainer: { marginVertical: 12, gap: 8 },
  optionsLabel: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary, marginBottom: 4 },
  optionBtn: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  optionText: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  optionTranslation: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  // Results
  resultContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  resultEmoji: { fontSize: 64, marginBottom: 12 },
  resultGrade: { fontSize: 48, fontWeight: "900" },
  resultLabel: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary, marginTop: 4 },
  resultScore: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
  resultCard: { backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 16, marginTop: 24, alignItems: "center", borderWidth: 1, borderColor: Colors.border, width: "100%" },
  resultCardTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  resultCardSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  resultActions: { flexDirection: "row", gap: 12, marginTop: 24, width: "100%" },
  resultBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12 },
  resultBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  tipsCard: { backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 16, marginTop: 20, width: "100%", borderWidth: 1, borderColor: Colors.border },
  tipsTitle: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary, marginBottom: 10 },
  tipItem: { fontSize: 13, color: Colors.textSecondary, lineHeight: 22 },
});
