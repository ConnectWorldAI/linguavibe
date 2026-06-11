/**
 * Virtual City Exploration - Enhanced
 * Immersive city walkthroughs with contextual conversations.
 * Inspired by Superfluent (TIME Best Invention 2025) but for ALL languages.
 * Features: City map, location scenarios, progression unlocks, cultural tips.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  FlatList,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface CityScenario {
  id: string;
  title: string;
  character: string;
  characterEmoji: string;
  difficulty: "easy" | "medium" | "hard";
  duration: string;
  completed: boolean;
  xpReward: number;
}

interface CityLocation {
  id: string;
  name: string;
  emoji: string;
  type: "food" | "transport" | "shopping" | "social" | "culture" | "nightlife" | "nature";
  description: string;
  localTip: string;
  slangPhrase: string;
  slangMeaning: string;
  scenarios: CityScenario[];
  unlocked: boolean;
  completedCount: number;
}

interface City {
  id: string;
  name: string;
  country: string;
  flag: string;
  language: string;
  greeting: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  locations: CityLocation[];
  unlocked: boolean;
  progress: number;
  totalXP: number;
}

// ─── CITY DATA ──────────────────────────────────────────────────────────────

const ALL_CITIES: City[] = [
  {
    id: "mexico-city", name: "Mexico City", country: "Mexico", flag: "🇲🇽",
    language: "Spanish (Mexican)", greeting: "¡Qué onda, güey! Bienvenido a la CDMX!",
    description: "Navigate the world's largest Spanish-speaking city. Tacos, markets, and metro chaos.",
    difficulty: "beginner", unlocked: true, progress: 0, totalXP: 0,
    locations: [
      {
        id: "taqueria", name: "Street Taquería", emoji: "🌮", type: "food",
        description: "A bustling street taco stand in Condesa. The taquero is fast — order quick or lose your spot.",
        localTip: "Never ask for a fork. Real tacos are eaten with your hands. Say 'con todo' for all toppings.",
        slangPhrase: "¡Está bien chido!", slangMeaning: "That's really cool! (Mexican slang)",
        unlocked: true, completedCount: 0,
        scenarios: [
          { id: "order-tacos", title: "Ordering Your First Tacos", character: "Don Beto", characterEmoji: "👨‍🍳", difficulty: "easy", duration: "3 min", completed: false, xpReward: 25 },
          { id: "salsa-challenge", title: "The Salsa Challenge", character: "Don Beto", characterEmoji: "🌶️", difficulty: "medium", duration: "4 min", completed: false, xpReward: 40 },
          { id: "regular-status", title: "Becoming a Regular", character: "Don Beto", characterEmoji: "🤝", difficulty: "hard", duration: "5 min", completed: false, xpReward: 60 },
        ],
      },
      {
        id: "metro", name: "Metro Chapultepec", emoji: "🚇", type: "transport",
        description: "The metro is packed, confusing, and the fastest way around. Don't get lost.",
        localTip: "Women-only cars are at the front during rush hour. Say 'bajan?' (getting off?) before pushing through.",
        slangPhrase: "¡Aguas!", slangMeaning: "Watch out! / Be careful! (from colonial times when people threw water from windows)",
        unlocked: true, completedCount: 0,
        scenarios: [
          { id: "buy-ticket", title: "Buying a Metro Card", character: "Vendedora", characterEmoji: "🎫", difficulty: "easy", duration: "2 min", completed: false, xpReward: 20 },
          { id: "ask-directions", title: "Asking for Directions Underground", character: "Señora Rosa", characterEmoji: "👩‍🦳", difficulty: "medium", duration: "4 min", completed: false, xpReward: 35 },
          { id: "lost-metro", title: "You Took the Wrong Line!", character: "Student Miguel", characterEmoji: "🧑‍🎓", difficulty: "hard", duration: "5 min", completed: false, xpReward: 55 },
        ],
      },
      {
        id: "mercado", name: "Mercado de la Merced", emoji: "🏪", type: "shopping",
        description: "The largest traditional market in the Americas. Haggling is expected — and respected.",
        localTip: "Start by offering 50% of the asking price. Walk away if they don't budge — they'll call you back.",
        slangPhrase: "¿A cómo me lo deja?", slangMeaning: "What's your best price? (haggling opener)",
        unlocked: false, completedCount: 0,
        scenarios: [
          { id: "fruit-stand", title: "Buying Exotic Fruits", character: "Doña Carmen", characterEmoji: "🍈", difficulty: "easy", duration: "3 min", completed: false, xpReward: 25 },
          { id: "haggle-clothes", title: "Haggling for a Jacket", character: "Vendedor Luis", characterEmoji: "🧥", difficulty: "medium", duration: "5 min", completed: false, xpReward: 45 },
          { id: "scam-avoid", title: "Spotting a Tourist Trap", character: "Suspicious Vendor", characterEmoji: "🕶️", difficulty: "hard", duration: "4 min", completed: false, xpReward: 60 },
        ],
      },
      {
        id: "cantina", name: "Cantina La Guadalupana", emoji: "🍺", type: "nightlife",
        description: "A 100-year-old cantina. Mariachis, mezcal, and conversations with strangers.",
        localTip: "Order mezcal 'derecho' (straight). Saying 'salud' before every sip is mandatory. Never refuse a toast.",
        slangPhrase: "¡Échale ganas!", slangMeaning: "Give it your all! / You got this! (encouragement)",
        unlocked: false, completedCount: 0,
        scenarios: [
          { id: "order-mezcal", title: "Ordering Mezcal Like a Local", character: "Bartender Javier", characterEmoji: "🥃", difficulty: "medium", duration: "4 min", completed: false, xpReward: 40 },
          { id: "mariachi-request", title: "Requesting a Song from Mariachis", character: "Mariachi Pedro", characterEmoji: "🎺", difficulty: "medium", duration: "3 min", completed: false, xpReward: 35 },
          { id: "deep-convo", title: "A Deep Conversation with a Stranger", character: "Philosopher Don Raúl", characterEmoji: "🧔", difficulty: "hard", duration: "7 min", completed: false, xpReward: 75 },
        ],
      },
    ],
  },
  {
    id: "tokyo", name: "Tokyo", country: "Japan", flag: "🇯🇵",
    language: "Japanese", greeting: "いらっしゃいませ！東京へようこそ！",
    description: "From convenience stores to izakayas, navigate the world's most polite city.",
    difficulty: "intermediate", unlocked: true, progress: 0, totalXP: 0,
    locations: [
      {
        id: "konbini", name: "Konbini (7-Eleven)", emoji: "🏪", type: "food",
        description: "Japanese convenience stores are a world of their own. Hot food, ATMs, and perfect onigiri.",
        localTip: "Say 'kekko desu' (I'm fine) when they ask about a bag. Don't eat while walking — it's rude.",
        slangPhrase: "やばい (yabai)", slangMeaning: "Amazing / Terrible / OMG (context-dependent youth slang)",
        unlocked: true, completedCount: 0,
        scenarios: [
          { id: "buy-onigiri", title: "Choosing Your First Onigiri", character: "Staff Yuki", characterEmoji: "🍙", difficulty: "easy", duration: "2 min", completed: false, xpReward: 20 },
          { id: "hot-food", title: "Ordering Hot Food at the Counter", character: "Staff Tanaka", characterEmoji: "🍗", difficulty: "medium", duration: "3 min", completed: false, xpReward: 30 },
          { id: "atm-help", title: "Getting Help with the ATM", character: "Manager Sato", characterEmoji: "💳", difficulty: "medium", duration: "4 min", completed: false, xpReward: 35 },
        ],
      },
      {
        id: "izakaya", name: "Izakaya (居酒屋)", emoji: "🍶", type: "nightlife",
        description: "A traditional Japanese pub. Shared plates, beer towers, and 'kampai!' with coworkers.",
        localTip: "Never pour your own drink — pour for others and they'll pour for you. Say 'toriaezu biiru' for 'beer for now'.",
        slangPhrase: "とりあえずビール！", slangMeaning: "Beer for now! (the universal Japanese after-work order)",
        unlocked: true, completedCount: 0,
        scenarios: [
          { id: "first-order", title: "Your First Izakaya Order", character: "Server Kenji", characterEmoji: "🍺", difficulty: "easy", duration: "3 min", completed: false, xpReward: 25 },
          { id: "nomikai", title: "Joining a Work Drinking Party", character: "Senpai Yamamoto", characterEmoji: "👔", difficulty: "hard", duration: "6 min", completed: false, xpReward: 65 },
        ],
      },
      {
        id: "train-station", name: "Shinjuku Station", emoji: "🚉", type: "transport",
        description: "The world's busiest train station. 3.5 million people daily. Don't panic.",
        localTip: "Follow the colored lines on the floor. If lost, say 'sumimasen' and show your destination on your phone.",
        slangPhrase: "電車に乗り遅れた！", slangMeaning: "I missed the train! (every commuter's nightmare)",
        unlocked: false, completedCount: 0,
        scenarios: [
          { id: "buy-suica", title: "Getting a Suica Card", character: "Station Staff", characterEmoji: "🎫", difficulty: "easy", duration: "2 min", completed: false, xpReward: 20 },
          { id: "wrong-platform", title: "You're on the Wrong Platform!", character: "Kind Stranger", characterEmoji: "🙋", difficulty: "medium", duration: "4 min", completed: false, xpReward: 40 },
        ],
      },
    ],
  },
  {
    id: "paris", name: "Paris", country: "France", flag: "🇫🇷",
    language: "French", greeting: "Bienvenue à Paris ! Allez, on y va !",
    description: "Cafés, boulangeries, and the art of being effortlessly rude. Survive Parisian French.",
    difficulty: "intermediate", unlocked: true, progress: 0, totalXP: 0,
    locations: [
      {
        id: "boulangerie", name: "Boulangerie du Coin", emoji: "🥐", type: "food",
        description: "The neighborhood bakery. Get your baguette and croissant before they sell out at 8am.",
        localTip: "Always say 'Bonjour' before ordering — skipping it is considered extremely rude in France.",
        slangPhrase: "C'est ouf !", slangMeaning: "That's crazy! (verlan — French backwards slang for 'fou')",
        unlocked: true, completedCount: 0,
        scenarios: [
          { id: "morning-bread", title: "The Morning Baguette Run", character: "Boulanger Pierre", characterEmoji: "👨‍🍳", difficulty: "easy", duration: "2 min", completed: false, xpReward: 20 },
          { id: "pastry-choice", title: "Choosing Between 20 Pastries", character: "Vendeuse Marie", characterEmoji: "🧁", difficulty: "medium", duration: "4 min", completed: false, xpReward: 35 },
        ],
      },
      {
        id: "cafe", name: "Café de Flore", emoji: "☕", type: "social",
        description: "The legendary literary café. Order an espresso and people-watch like Sartre did.",
        localTip: "Sitting inside is cheaper than the terrace. Say 'un café' for espresso — 'un café allongé' for Americano.",
        slangPhrase: "Ça roule !", slangMeaning: "It's all good! / Sounds like a plan! (casual agreement)",
        unlocked: true, completedCount: 0,
        scenarios: [
          { id: "order-coffee", title: "Ordering Coffee Without Being Judged", character: "Serveur Antoine", characterEmoji: "☕", difficulty: "easy", duration: "3 min", completed: false, xpReward: 25 },
          { id: "cafe-convo", title: "Chatting with a Stranger at the Bar", character: "Student Camille", characterEmoji: "📚", difficulty: "medium", duration: "5 min", completed: false, xpReward: 45 },
          { id: "rude-waiter", title: "Handling a Rude Waiter", character: "Serveur Grumpy", characterEmoji: "😤", difficulty: "hard", duration: "4 min", completed: false, xpReward: 55 },
        ],
      },
    ],
  },
  {
    id: "santo-domingo", name: "Santo Domingo", country: "Dominican Republic", flag: "🇩🇴",
    language: "Spanish (Dominican)", greeting: "¡Klk manin! Bienvenido a Quisqueya!",
    description: "Dominican Spanish hits different. Fast, slang-heavy, and full of dembow energy.",
    difficulty: "advanced", unlocked: true, progress: 0, totalXP: 0,
    locations: [
      {
        id: "colmado", name: "El Colmado", emoji: "🏪", type: "social",
        description: "The corner store / social hub. Music blasting, dominos slamming, cold Presidente flowing.",
        localTip: "A colmado is not just a store — it's where the neighborhood hangs out. Say 'dame una fría' for a cold beer.",
        slangPhrase: "¡Tá to'!", slangMeaning: "It's all good! / Everything's fine! (Dominican for 'está todo')",
        unlocked: true, completedCount: 0,
        scenarios: [
          { id: "buy-beer", title: "Getting a Cold Presidente", character: "Colmadero Juan", characterEmoji: "🍺", difficulty: "easy", duration: "2 min", completed: false, xpReward: 20 },
          { id: "dominos", title: "Joining a Dominos Game", character: "Vecino Ramón", characterEmoji: "🎲", difficulty: "medium", duration: "5 min", completed: false, xpReward: 45 },
          { id: "gossip", title: "Understanding the Neighborhood Gossip", character: "Doña Altagracia", characterEmoji: "👵", difficulty: "hard", duration: "6 min", completed: false, xpReward: 65 },
        ],
      },
      {
        id: "guagua", name: "La Guagua (Bus)", emoji: "🚌", type: "transport",
        description: "Public transport Dominican style. Packed, loud, and the cobrador yells destinations.",
        localTip: "Yell 'BAJA!' when you want to get off. Have exact change ready. Don't sit in the back if you're getting off soon.",
        slangPhrase: "¡Vaina!", slangMeaning: "Thing / Stuff / Damn! (the most Dominican word ever — means everything)",
        unlocked: true, completedCount: 0,
        scenarios: [
          { id: "catch-guagua", title: "Flagging Down the Right Guagua", character: "Cobrador Willy", characterEmoji: "🚌", difficulty: "medium", duration: "3 min", completed: false, xpReward: 30 },
          { id: "wrong-stop", title: "You Missed Your Stop!", character: "Pasajera María", characterEmoji: "😱", difficulty: "hard", duration: "4 min", completed: false, xpReward: 50 },
        ],
      },
    ],
  },
  {
    id: "seoul", name: "Seoul", country: "South Korea", flag: "🇰🇷",
    language: "Korean", greeting: "서울에 오신 것을 환영합니다!",
    description: "K-BBQ, karaoke, and the fastest internet in the world. Navigate Korean politeness levels.",
    difficulty: "intermediate", unlocked: false, progress: 0, totalXP: 0,
    locations: [
      {
        id: "kbbq", name: "Korean BBQ Restaurant", emoji: "🥩", type: "food",
        description: "Grill your own meat, wrap it in lettuce, and don't forget the soju shots.",
        localTip: "The youngest person pours drinks for elders. Turn away when drinking in front of seniors.",
        slangPhrase: "대박! (daebak)", slangMeaning: "Amazing! / Jackpot! (Korean exclamation of surprise)",
        unlocked: true, completedCount: 0,
        scenarios: [
          { id: "order-set", title: "Ordering a BBQ Set for Two", character: "Server 민지", characterEmoji: "🥩", difficulty: "easy", duration: "3 min", completed: false, xpReward: 25 },
          { id: "soju-etiquette", title: "Soju Pouring Etiquette", character: "Senior 김부장", characterEmoji: "🍶", difficulty: "medium", duration: "4 min", completed: false, xpReward: 40 },
        ],
      },
    ],
  },
  {
    id: "cairo", name: "Cairo", country: "Egypt", flag: "🇪🇬",
    language: "Arabic (Egyptian)", greeting: "!أهلاً وسهلاً في القاهرة",
    description: "Egyptian Arabic is the most understood dialect. Chaos, humor, and incredible hospitality.",
    difficulty: "advanced", unlocked: false, progress: 0, totalXP: 0,
    locations: [
      {
        id: "khan-khalili", name: "Khan el-Khalili Bazaar", emoji: "🕌", type: "shopping",
        description: "The ancient bazaar. Spices, gold, perfumes, and the world's most persistent salesmen.",
        localTip: "Never accept the first price. Start at 30% and meet in the middle. Tea is always free — accept it.",
        slangPhrase: "يا سلام! (ya salaam)", slangMeaning: "Oh wow! / How wonderful! (expression of amazement)",
        unlocked: true, completedCount: 0,
        scenarios: [
          { id: "spice-shop", title: "Buying Spices at the Bazaar", character: "Merchant حسن", characterEmoji: "🧂", difficulty: "medium", duration: "4 min", completed: false, xpReward: 35 },
          { id: "haggle-gold", title: "Haggling for Gold Jewelry", character: "Goldsmith عمر", characterEmoji: "💍", difficulty: "hard", duration: "6 min", completed: false, xpReward: 60 },
        ],
      },
    ],
  },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function CityExplorationScreen() {
  const colors = useColors();
  const [cities, setCities] = useState(ALL_CITIES);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<CityLocation | null>(null);
  const [view, setView] = useState<"cities" | "city" | "location">("cities");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem("@city_exploration_progress");
      if (saved) {
        const progress = JSON.parse(saved);
        setCities((prev) => prev.map((city) => ({
          ...city,
          progress: progress[city.id]?.progress || 0,
          totalXP: progress[city.id]?.totalXP || 0,
        })));
      }
    } catch {}
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === "easy" || diff === "beginner") return "#10B981";
    if (diff === "medium" || diff === "intermediate") return "#F59E0B";
    return "#EF4444";
  };

  const getTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      food: "restaurant", transport: "bus", shopping: "cart",
      social: "people", culture: "library", nightlife: "moon", nature: "leaf",
    };
    return icons[type] || "location";
  };

  const navigateToCity = (city: City) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCity(city);
    setView("city");
  };

  const navigateToLocation = (location: CityLocation) => {
    if (!location.unlocked) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLocation(location);
    setView("location");
  };

  const startScenario = (scenario: CityScenario) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/scenario-chat",
      params: {
        title: scenario.title,
        character: scenario.character,
        city: selectedCity?.name,
        language: selectedCity?.language,
        difficulty: scenario.difficulty,
      },
    } as any);
  };

  // ─── CITY LIST VIEW ─────────────────────────────────────────────────────────

  const renderCityList = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>Explore the World</Text>
        <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
          Walk through real cities. Practice real conversations. Learn real language.
        </Text>
      </View>

      {cities.map((city) => (
        <TouchableOpacity
          key={city.id}
          style={[styles.cityCard, { backgroundColor: colors.surface, opacity: city.unlocked ? 1 : 0.5 }]}
          onPress={() => city.unlocked && navigateToCity(city)}
          activeOpacity={0.7}
          disabled={!city.unlocked}
        >
          <View style={styles.cityCardTop}>
            <Text style={styles.cityFlag}>{city.flag}</Text>
            <View style={styles.cityInfo}>
              <Text style={[styles.cityName, { color: colors.foreground }]}>{city.name}</Text>
              <Text style={[styles.cityCountry, { color: colors.muted }]}>{city.country} • {city.language}</Text>
            </View>
            {!city.unlocked && (
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={14} color={colors.muted} />
              </View>
            )}
            <View style={[styles.diffBadge, { backgroundColor: getDifficultyColor(city.difficulty) + "20" }]}>
              <Text style={[styles.diffText, { color: getDifficultyColor(city.difficulty) }]}>{city.difficulty}</Text>
            </View>
          </View>
          <Text style={[styles.cityDesc, { color: colors.muted }]}>{city.description}</Text>
          <Text style={[styles.cityGreeting, { color: colors.primary }]}>"{city.greeting}"</Text>
          {city.unlocked && (
            <View style={styles.cityProgress}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${city.progress}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.muted }]}>{city.locations.length} locations • {city.totalXP} XP</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // ─── CITY DETAIL VIEW ───────────────────────────────────────────────────────

  const renderCityDetail = () => {
    if (!selectedCity) return null;
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* City Header */}
        <View style={[styles.cityDetailHeader, { backgroundColor: colors.surface }]}>
          <Text style={styles.cityDetailFlag}>{selectedCity.flag}</Text>
          <Text style={[styles.cityDetailName, { color: colors.foreground }]}>{selectedCity.name}</Text>
          <Text style={[styles.cityDetailLang, { color: colors.muted }]}>{selectedCity.language}</Text>
          <Text style={[styles.cityDetailGreeting, { color: colors.primary }]}>"{selectedCity.greeting}"</Text>
        </View>

        {/* Locations Grid */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Locations</Text>
        {selectedCity.locations.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={[styles.locationCard, {
              backgroundColor: colors.surface,
              opacity: location.unlocked ? 1 : 0.5,
              borderLeftColor: location.unlocked ? colors.primary : colors.border,
            }]}
            onPress={() => navigateToLocation(location)}
            activeOpacity={0.7}
            disabled={!location.unlocked}
          >
            <View style={styles.locationTop}>
              <Text style={styles.locationEmoji}>{location.emoji}</Text>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationName, { color: colors.foreground }]}>{location.name}</Text>
                <View style={styles.locationMeta}>
                  <Ionicons name={getTypeIcon(location.type) as any} size={12} color={colors.muted} />
                  <Text style={[styles.locationTypeName, { color: colors.muted }]}>{location.type}</Text>
                  <Text style={[styles.locationScenarioCount, { color: colors.muted }]}>
                    • {location.scenarios.length} scenarios
                  </Text>
                </View>
              </View>
              {!location.unlocked ? (
                <Ionicons name="lock-closed" size={16} color={colors.muted} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              )}
            </View>
            <Text style={[styles.locationDesc, { color: colors.muted }]} numberOfLines={2}>{location.description}</Text>
            {/* Slang Preview */}
            <View style={[styles.slangPreview, { backgroundColor: colors.background }]}>
              <Text style={[styles.slangPhrase, { color: colors.foreground }]}>{location.slangPhrase}</Text>
              <Text style={[styles.slangMeaning, { color: colors.muted }]}>{location.slangMeaning}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // ─── LOCATION DETAIL VIEW ──────────────────────────────────────────────────

  const renderLocationDetail = () => {
    if (!selectedLocation || !selectedCity) return null;
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Location Header */}
        <View style={[styles.locationDetailHeader, { backgroundColor: colors.surface }]}>
          <Text style={styles.locationDetailEmoji}>{selectedLocation.emoji}</Text>
          <Text style={[styles.locationDetailName, { color: colors.foreground }]}>{selectedLocation.name}</Text>
          <Text style={[styles.locationDetailCity, { color: colors.muted }]}>{selectedCity.flag} {selectedCity.name}</Text>
          <Text style={[styles.locationDetailDesc, { color: colors.muted }]}>{selectedLocation.description}</Text>
        </View>

        {/* Local Tip */}
        <View style={[styles.tipCard, { backgroundColor: "#F59E0B15", borderColor: "#F59E0B40" }]}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={[styles.tipTitle, { color: "#F59E0B" }]}>Local Insider Tip</Text>
          </View>
          <Text style={[styles.tipText, { color: colors.foreground }]}>{selectedLocation.localTip}</Text>
        </View>

        {/* Slang Card */}
        <View style={[styles.slangCard, { backgroundColor: colors.surface }]}>
          <View style={styles.slangCardHeader}>
            <Text style={styles.slangCardIcon}>🗣️</Text>
            <Text style={[styles.slangCardTitle, { color: colors.foreground }]}>Local Slang</Text>
          </View>
          <Text style={[styles.slangCardPhrase, { color: colors.primary }]}>{selectedLocation.slangPhrase}</Text>
          <Text style={[styles.slangCardMeaning, { color: colors.muted }]}>{selectedLocation.slangMeaning}</Text>
        </View>

        {/* Scenarios */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Conversations</Text>
        {selectedLocation.scenarios.map((scenario) => (
          <TouchableOpacity
            key={scenario.id}
            style={[styles.scenarioCard, { backgroundColor: colors.surface }]}
            onPress={() => startScenario(scenario)}
            activeOpacity={0.7}
          >
            <View style={styles.scenarioTop}>
              <Text style={styles.scenarioCharEmoji}>{scenario.characterEmoji}</Text>
              <View style={styles.scenarioInfo}>
                <Text style={[styles.scenarioTitle, { color: colors.foreground }]}>{scenario.title}</Text>
                <Text style={[styles.scenarioChar, { color: colors.muted }]}>with {scenario.character}</Text>
              </View>
              {scenario.completed ? (
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              ) : (
                <View style={[styles.xpBadge, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.xpText, { color: colors.primary }]}>+{scenario.xpReward} XP</Text>
                </View>
              )}
            </View>
            <View style={styles.scenarioMeta}>
              <View style={[styles.scenarioDiffBadge, { backgroundColor: getDifficultyColor(scenario.difficulty) + "20" }]}>
                <Text style={[styles.scenarioDiffText, { color: getDifficultyColor(scenario.difficulty) }]}>{scenario.difficulty}</Text>
              </View>
              <View style={styles.scenarioDuration}>
                <Ionicons name="time-outline" size={12} color={colors.muted} />
                <Text style={[styles.scenarioDurationText, { color: colors.muted }]}>{scenario.duration}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────

  const getBackAction = () => {
    if (view === "location") { setView("city"); setSelectedLocation(null); }
    else if (view === "city") { setView("cities"); setSelectedCity(null); }
    else { router.back(); }
  };

  const getTitle = () => {
    if (view === "location" && selectedLocation) return selectedLocation.name;
    if (view === "city" && selectedCity) return selectedCity.name;
    return "City Exploration";
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={getBackAction} style={styles.backBtn}>
          <Ionicons name={view === "cities" ? "arrow-back" : "chevron-back"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{getTitle()}</Text>
        <View style={{ width: 30 }} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {view === "cities" && renderCityList()}
        {view === "city" && renderCityDetail()}
        {view === "location" && renderLocationDetail()}
      </Animated.View>
    </ScreenContainer>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  heroSection: { marginBottom: 20 },
  heroTitle: { fontSize: 28, fontWeight: "800" },
  heroSubtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  cityCard: { borderRadius: 16, padding: 16, marginBottom: 14 },
  cityCardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  cityFlag: { fontSize: 32 },
  cityInfo: { flex: 1 },
  cityName: { fontSize: 18, fontWeight: "700" },
  cityCountry: { fontSize: 12, marginTop: 2 },
  lockBadge: { padding: 4 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  diffText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  cityDesc: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  cityGreeting: { fontSize: 12, fontStyle: "italic", marginBottom: 10 },
  cityProgress: { marginTop: 4 },
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  progressText: { fontSize: 11, marginTop: 4 },
  cityDetailHeader: { borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 20 },
  cityDetailFlag: { fontSize: 48 },
  cityDetailName: { fontSize: 24, fontWeight: "800", marginTop: 8 },
  cityDetailLang: { fontSize: 13, marginTop: 4 },
  cityDetailGreeting: { fontSize: 14, fontStyle: "italic", marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  locationCard: { borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 3 },
  locationTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  locationEmoji: { fontSize: 28 },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 15, fontWeight: "700" },
  locationMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  locationTypeName: { fontSize: 11, textTransform: "capitalize" },
  locationScenarioCount: { fontSize: 11 },
  locationDesc: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  slangPreview: { padding: 10, borderRadius: 8 },
  slangPhrase: { fontSize: 13, fontWeight: "700" },
  slangMeaning: { fontSize: 11, marginTop: 2 },
  locationDetailHeader: { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 16 },
  locationDetailEmoji: { fontSize: 44 },
  locationDetailName: { fontSize: 20, fontWeight: "800", marginTop: 8 },
  locationDetailCity: { fontSize: 13, marginTop: 4 },
  locationDetailDesc: { fontSize: 13, marginTop: 8, textAlign: "center", lineHeight: 18 },
  tipCard: { borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1 },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  tipIcon: { fontSize: 16 },
  tipTitle: { fontSize: 13, fontWeight: "700" },
  tipText: { fontSize: 13, lineHeight: 18 },
  slangCard: { borderRadius: 12, padding: 16, marginBottom: 14 },
  slangCardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  slangCardIcon: { fontSize: 16 },
  slangCardTitle: { fontSize: 13, fontWeight: "700" },
  slangCardPhrase: { fontSize: 18, fontWeight: "800" },
  slangCardMeaning: { fontSize: 13, marginTop: 4 },
  scenarioCard: { borderRadius: 12, padding: 16, marginBottom: 10 },
  scenarioTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  scenarioCharEmoji: { fontSize: 28 },
  scenarioInfo: { flex: 1 },
  scenarioTitle: { fontSize: 14, fontWeight: "700" },
  scenarioChar: { fontSize: 12, marginTop: 2 },
  xpBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  xpText: { fontSize: 11, fontWeight: "700" },
  scenarioMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, marginLeft: 40 },
  scenarioDiffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  scenarioDiffText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  scenarioDuration: { flexDirection: "row", alignItems: "center", gap: 4 },
  scenarioDurationText: { fontSize: 11 },
});
