import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

type Neighborhood = {
  id: string;
  name: string;
  emoji: string;
  vibe: string;
  description: string;
  mustTry: string[];
  localTip: string;
  difficulty: "easy" | "medium" | "hard";
  scenarios: { id: string; title: string; character: string; characterEmoji: string }[];
};

type CityData = {
  id: string;
  name: string;
  country: string;
  flag: string;
  language: string;
  greeting: string;
  timeZone: string;
  currency: string;
  neighborhoods: Neighborhood[];
};

const CITIES: Record<string, CityData> = {
  barcelona: {
    id: "barcelona", name: "Barcelona", country: "Spain", flag: "🇪🇸",
    language: "Spanish (Catalan)", greeting: "¡Hola! Benvinguts a Barcelona!",
    timeZone: "CET (UTC+1)", currency: "Euro (€)",
    neighborhoods: [
      {
        id: "gothic", name: "Gothic Quarter", emoji: "🏛️", vibe: "Historic & Mysterious",
        description: "Narrow medieval streets, hidden plazas, and centuries-old tapas bars. This is where Barcelona's soul lives.",
        mustTry: ["Pintxos at a standing bar", "Churros con chocolate at dawn", "Vermouth at a plaza café"],
        localTip: "Locals never eat dinner before 9pm. Say 'una caña' for a small beer — it's cheaper and more authentic than ordering 'cerveza'.",
        difficulty: "easy",
        scenarios: [
          { id: "tapas-bar", title: "Ordering Tapas Like a Local", character: "Carlos", characterEmoji: "👨‍🍳" },
          { id: "lost-streets", title: "Getting Directions in Narrow Streets", character: "Abuela María", characterEmoji: "👵" },
          { id: "plaza-chat", title: "Making Friends at a Plaza Café", character: "Lucía", characterEmoji: "👩‍🎨" },
        ],
      },
      {
        id: "la-rambla", name: "La Rambla", emoji: "🌳", vibe: "Bustling & Touristy",
        description: "The famous tree-lined boulevard. Learn to navigate vendors, street performers, and the legendary Boquería market.",
        mustTry: ["Fresh juice at La Boquería", "Watching human statues", "Buying flowers from a rambla stall"],
        localTip: "Never eat at restaurants ON La Rambla — go one street over for half the price and double the quality. Locals call tourists who eat here 'guiris'.",
        difficulty: "easy",
        scenarios: [
          { id: "boqueria", title: "Haggling at La Boquería Market", character: "Paco", characterEmoji: "🧔" },
          { id: "street-performer", title: "Chatting with a Street Performer", character: "Mimo", characterEmoji: "🎭" },
          { id: "taxi-ride", title: "Negotiating a Taxi to the Beach", character: "Driver Ahmed", characterEmoji: "🚕" },
        ],
      },
      {
        id: "barceloneta", name: "Barceloneta Beach", emoji: "🏖️", vibe: "Chill & Sporty",
        description: "The local beach neighborhood. Surfers, chiringuitos (beach bars), and the freshest seafood paella you'll ever taste.",
        mustTry: ["Paella at a chiringuito", "Paddleboarding lesson", "Sunset sangria on the sand"],
        localTip: "Order 'fideuà' instead of paella — it's the local noodle version and Barceloneta locals consider it superior. Don't put sunscreen on right before swimming, locals will judge you.",
        difficulty: "medium",
        scenarios: [
          { id: "chiringuito", title: "Ordering Seafood at a Beach Bar", character: "Marta", characterEmoji: "👩‍🍳" },
          { id: "surf-lesson", title: "Booking a Surf Lesson", character: "Dani", characterEmoji: "🏄" },
          { id: "beach-vendor", title: "Declining a Beach Vendor Politely", character: "Vendor", characterEmoji: "🧴" },
        ],
      },
      {
        id: "gracia", name: "Gràcia", emoji: "🎨", vibe: "Bohemian & Artsy",
        description: "The creative heart of Barcelona. Independent boutiques, vermouth bars, and locals who speak more Catalan than Spanish.",
        mustTry: ["Vermouth at Plaça del Sol", "Vintage shopping on Carrer Verdi", "Attending a local festa"],
        localTip: "Gràcia locals are proud of their Catalan identity. Try saying 'Bon dia' (Catalan good morning) instead of 'Buenos días' — they'll warm up to you instantly.",
        difficulty: "hard",
        scenarios: [
          { id: "vermouth-bar", title: "Ordering Vermouth Like a Gràcia Local", character: "Jordi", characterEmoji: "🧑‍🎤" },
          { id: "vintage-shop", title: "Asking About Vintage Finds", character: "Nuria", characterEmoji: "👗" },
          { id: "catalan-chat", title: "Switching Between Spanish & Catalan", character: "Pere", characterEmoji: "📚" },
        ],
      },
    ],
  },
  tokyo: {
    id: "tokyo", name: "Tokyo", country: "Japan", flag: "🇯🇵",
    language: "Japanese", greeting: "いらっしゃいませ！東京へようこそ！",
    timeZone: "JST (UTC+9)", currency: "Yen (¥)",
    neighborhoods: [
      {
        id: "shibuya", name: "Shibuya", emoji: "🏙️", vibe: "Trendy & Energetic",
        description: "The iconic crossing, fashion-forward youth, and endless izakayas. Where modern Tokyo comes alive at night.",
        mustTry: ["Crossing the Shibuya Scramble", "Late-night ramen at a standing bar", "Karaoke in a tiny box room"],
        localTip: "Don't jaywalk — even if no cars are coming. Japanese people will stare. Also, never eat while walking. Find a bench or stand still.",
        difficulty: "medium",
        scenarios: [
          { id: "ramen-shop", title: "Ordering at a Ticket Machine Ramen Shop", character: "Tanaka-san", characterEmoji: "👨‍🍳" },
          { id: "karaoke", title: "Booking a Karaoke Room", character: "Yuki", characterEmoji: "🎤" },
          { id: "train-help", title: "Asking for Train Help at Rush Hour", character: "Salaryman Kenji", characterEmoji: "👔" },
        ],
      },
      {
        id: "asakusa", name: "Asakusa", emoji: "⛩️", vibe: "Traditional & Spiritual",
        description: "Ancient temples, traditional crafts, and the old-world charm of Edo-era Tokyo. Senso-ji temple draws millions.",
        mustTry: ["Drawing an omikuji fortune", "Freshly made ningyo-yaki", "Rickshaw ride through back streets"],
        localTip: "Bow slightly when entering the temple gate. Don't point at things with chopsticks. If you get a bad fortune (凶), tie it to the rack — it stays at the temple instead of following you.",
        difficulty: "easy",
        scenarios: [
          { id: "temple-visit", title: "Visiting Senso-ji Temple", character: "Obaachan Hanako", characterEmoji: "👘" },
          { id: "souvenir-shop", title: "Buying Traditional Souvenirs", character: "Craftsman Sato", characterEmoji: "🎎" },
          { id: "rickshaw", title: "Negotiating a Rickshaw Tour", character: "Runner Takeshi", characterEmoji: "🏃" },
        ],
      },
      {
        id: "akihabara", name: "Akihabara", emoji: "🎮", vibe: "Geeky & Electric",
        description: "Anime paradise, maid cafés, retro game shops, and electronics galore. Where otaku culture thrives.",
        mustTry: ["Visiting a multi-floor arcade", "Maid café experience", "Hunting for rare figures"],
        localTip: "Don't take photos of cosplayers without asking 'Shashin ii desu ka?' (Can I take a photo?). In arcades, don't hog machines — one play then move on if others are waiting.",
        difficulty: "medium",
        scenarios: [
          { id: "maid-cafe", title: "Your First Maid Café Experience", character: "Maid Sakura", characterEmoji: "🎀" },
          { id: "game-shop", title: "Finding a Rare Game at a Retro Shop", character: "Otaku Hiroshi", characterEmoji: "🎮" },
          { id: "electronics", title: "Buying Electronics Tax-Free", character: "Shop Staff Aoi", characterEmoji: "📱" },
        ],
      },
    ],
  },
  paris: {
    id: "paris", name: "Paris", country: "France", flag: "🇫🇷",
    language: "French", greeting: "Bienvenue à Paris, la Ville Lumière!",
    timeZone: "CET (UTC+1)", currency: "Euro (€)",
    neighborhoods: [
      {
        id: "montmartre", name: "Montmartre", emoji: "🎨", vibe: "Artistic & Romantic",
        description: "Hilltop artists' village with cobblestone streets, Sacré-Cœur, and the best wine bars in Paris.",
        mustTry: ["Wine tasting at a cave", "Watching painters at Place du Tertre", "Crêpes from a street vendor"],
        localTip: "Never say 'Bonjour' without following it with 'Monsieur' or 'Madame' — it's considered rude. Also, don't skip the greeting when entering ANY shop, even a convenience store.",
        difficulty: "easy",
        scenarios: [
          { id: "wine-bar", title: "Wine Tasting at a Cave à Vin", character: "Sommelier Pierre", characterEmoji: "🍷" },
          { id: "artist-chat", title: "Commissioning a Portrait", character: "Artiste Claude", characterEmoji: "🎨" },
          { id: "crepe-stand", title: "Ordering a Crêpe with Toppings", character: "Crêpier Marie", characterEmoji: "🥞" },
        ],
      },
      {
        id: "marais", name: "Le Marais", emoji: "🏘️", vibe: "Trendy & Historic",
        description: "Medieval mansions turned into galleries, the best falafel in Europe, and Paris's LGBTQ+ heart.",
        mustTry: ["Falafel on Rue des Rosiers", "Browsing concept stores", "Sunday brunch at a terrasse"],
        localTip: "Le Marais is one of the few neighborhoods open on Sundays. Parisians do their 'Sunday stroll' here. Don't rush — sit at a café and people-watch. That IS the activity.",
        difficulty: "medium",
        scenarios: [
          { id: "falafel-line", title: "Ordering in the Famous Falafel Queue", character: "Vendeur Youssef", characterEmoji: "🧆" },
          { id: "gallery-visit", title: "Discussing Art at a Gallery", character: "Galeriste Isabelle", characterEmoji: "🖼️" },
          { id: "brunch-spot", title: "Getting a Table at a Packed Brunch Spot", character: "Serveur Antoine", characterEmoji: "☕" },
        ],
      },
    ],
  },
  seoul: {
    id: "seoul", name: "Seoul", country: "South Korea", flag: "🇰🇷",
    language: "Korean", greeting: "서울에 오신 것을 환영합니다!",
    timeZone: "KST (UTC+9)", currency: "Won (₩)",
    neighborhoods: [
      {
        id: "hongdae", name: "Hongdae", emoji: "🎵", vibe: "Young & Creative",
        description: "University district with indie music, street performances, quirky cafés, and the best nightlife in Seoul.",
        mustTry: ["Street food at the night market", "Noraebang (Korean karaoke)", "Watching buskers at the playground"],
        localTip: "In Korea, age matters in conversation. Always ask '몇 살이에요?' (How old are you?) early — it determines if you use formal or casual speech. Don't pour your own drink at dinner.",
        difficulty: "medium",
        scenarios: [
          { id: "street-food", title: "Ordering Tteokbokki at a Street Stall", character: "Ajumma Kim", characterEmoji: "👩‍🍳" },
          { id: "noraebang", title: "Booking a Noraebang Room", character: "Staff Minjun", characterEmoji: "🎤" },
          { id: "cafe-order", title: "Ordering at a Themed Café", character: "Barista Soyeon", characterEmoji: "☕" },
        ],
      },
      {
        id: "myeongdong", name: "Myeongdong", emoji: "🛍️", vibe: "Shopping & K-Beauty",
        description: "K-beauty paradise with skincare shops on every corner, street food alleys, and the latest fashion trends.",
        mustTry: ["Free skincare samples at every shop", "Hotteok (sweet pancake) from a vendor", "Sheet mask shopping spree"],
        localTip: "Shop staff will follow you around — it's normal and expected. Say '괜찮아요' (I'm fine) if you want space. They'll give you free samples regardless. Accept them with both hands.",
        difficulty: "easy",
        scenarios: [
          { id: "skincare-shop", title: "Getting a Skincare Recommendation", character: "Beauty Advisor Jihye", characterEmoji: "💄" },
          { id: "haggling", title: "Asking for a Discount at a Fashion Stall", character: "Vendor Ahjussi", characterEmoji: "👔" },
          { id: "directions", title: "Finding the Subway in a Crowd", character: "Student Hyunjin", characterEmoji: "🎒" },
        ],
      },
    ],
  },
  rio: {
    id: "rio", name: "Rio de Janeiro", country: "Brazil", flag: "🇧🇷",
    language: "Portuguese (Brazilian)", greeting: "Bem-vindo ao Rio! Tudo beleza?",
    timeZone: "BRT (UTC-3)", currency: "Real (R$)",
    neighborhoods: [
      {
        id: "copacabana", name: "Copacabana", emoji: "🏖️", vibe: "Beach Life & Energy",
        description: "The world's most famous beach. Caipirinhas, beach volleyball, and the art of doing nothing beautifully.",
        mustTry: ["Caipirinha from a beach vendor", "Açaí bowl on the boardwalk", "Beach volleyball with locals"],
        localTip: "Never leave valuables on the beach. Locals bring only a towel and cash. Say 'E aí, beleza?' (Hey, what's up?) instead of formal greetings — Rio is super casual.",
        difficulty: "easy",
        scenarios: [
          { id: "beach-vendor", title: "Buying a Caipirinha on the Beach", character: "Vendedor Marcos", characterEmoji: "🍹" },
          { id: "volleyball", title: "Joining a Beach Volleyball Game", character: "Player Fernanda", characterEmoji: "🏐" },
          { id: "acai-stand", title: "Customizing Your Açaí Bowl", character: "Açaí Girl Bruna", characterEmoji: "🫐" },
        ],
      },
      {
        id: "lapa", name: "Lapa", emoji: "🎶", vibe: "Samba & Nightlife",
        description: "The beating heart of Rio's music scene. Samba clubs, the famous Arcos da Lapa, and dancing until sunrise.",
        mustTry: ["Samba dancing at a roda de samba", "Churrasco at a boteco", "Climbing the Selarón Steps"],
        localTip: "In samba, the basic step is called 'samba no pé'. Don't be shy — Brazilians LOVE when foreigners try to dance. They'll teach you. Say 'Me ensina?' (Teach me?) and you'll make instant friends.",
        difficulty: "medium",
        scenarios: [
          { id: "samba-club", title: "Entering a Samba Club", character: "Doorman Rodrigo", characterEmoji: "💃" },
          { id: "dance-lesson", title: "Getting a Spontaneous Dance Lesson", character: "Dancer Camila", characterEmoji: "🩰" },
          { id: "boteco-order", title: "Ordering at a Traditional Boteco", character: "Garçom João", characterEmoji: "🍺" },
        ],
      },
    ],
  },
};

export default function CityExploreScreen() {
  const params = useLocalSearchParams<{ city?: string }>();
  const cityKey = (params.city || "barcelona").toLowerCase();
  const city = CITIES[cityKey] || CITIES.barcelona;
  const [selectedHood, setSelectedHood] = useState<Neighborhood | null>(null);

  if (selectedHood) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        {/* Neighborhood Detail Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedHood(null)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{selectedHood.emoji} {selectedHood.name}</Text>
            <Text style={styles.headerSubtitle}>{selectedHood.vibe}</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Neighborhood Description */}
          <View style={styles.descCard}>
            <Text style={styles.descText}>{selectedHood.description}</Text>
            <View style={styles.diffBadge}>
              <Ionicons name="speedometer-outline" size={14} color={
                selectedHood.difficulty === "easy" ? Colors.success :
                selectedHood.difficulty === "medium" ? Colors.warning : Colors.accent
              } />
              <Text style={[styles.diffText, { color:
                selectedHood.difficulty === "easy" ? Colors.success :
                selectedHood.difficulty === "medium" ? Colors.warning : Colors.accent
              }]}>{selectedHood.difficulty} conversations</Text>
            </View>
          </View>

          {/* Local Insider Tip */}
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipTitle}>Local Insider Tip</Text>
            </View>
            <Text style={styles.tipText}>{selectedHood.localTip}</Text>
          </View>

          {/* Must Try */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Must Try</Text>
            {selectedHood.mustTry.map((item, i) => (
              <View key={i} style={styles.mustTryRow}>
                <View style={styles.mustTryDot} />
                <Text style={styles.mustTryText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Practice Scenarios with AI Characters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Practice Conversations</Text>
            <Text style={styles.sectionDesc}>Tap a scenario to chat with a local AI character</Text>
            {selectedHood.scenarios.map((scenario) => (
              <TouchableOpacity
                key={scenario.id}
                style={styles.scenarioCard}
                activeOpacity={0.7}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/scenario-chat" as any,
                    params: {
                      scenarioId: scenario.id,
                      scenarioTitle: scenario.title,
                      characterName: scenario.character,
                      characterEmoji: scenario.characterEmoji,
                      city: city.name,
                      neighborhood: selectedHood.name,
                      language: city.language,
                    },
                  });
                }}
              >
                <View style={styles.scenarioAvatar}>
                  <Text style={{ fontSize: 24 }}>{scenario.characterEmoji}</Text>
                </View>
                <View style={styles.scenarioInfo}>
                  <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                  <Text style={styles.scenarioCharacter}>with {scenario.character}</Text>
                </View>
                <View style={styles.scenarioArrow}>
                  <Ionicons name="chatbubbles" size={16} color={Colors.secondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* City Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{city.flag} {city.name}</Text>
          <Text style={styles.headerSubtitle}>{city.language}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* City Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeGreeting}>{city.greeting}</Text>
          <View style={styles.welcomeMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{city.timeZone}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{city.currency}</Text>
            </View>
          </View>
        </View>

        {/* Neighborhoods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Neighborhoods</Text>
          <Text style={styles.sectionDesc}>Each area has unique characters and conversations to practice</Text>
          
          {city.neighborhoods.map((hood) => (
            <TouchableOpacity
              key={hood.id}
              style={styles.hoodCard}
              activeOpacity={0.7}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedHood(hood);
              }}
            >
              <View style={styles.hoodEmoji}>
                <Text style={{ fontSize: 28 }}>{hood.emoji}</Text>
              </View>
              <View style={styles.hoodInfo}>
                <Text style={styles.hoodName}>{hood.name}</Text>
                <Text style={styles.hoodVibe}>{hood.vibe}</Text>
                <View style={styles.hoodMeta}>
                  <View style={[styles.hoodDiff, { backgroundColor:
                    hood.difficulty === "easy" ? Colors.greenGlow :
                    hood.difficulty === "medium" ? Colors.yellowGlow : Colors.redGlow
                  }]}>
                    <Text style={[styles.hoodDiffText, { color:
                      hood.difficulty === "easy" ? Colors.success :
                      hood.difficulty === "medium" ? Colors.warning : Colors.accent
                    }]}>{hood.difficulty}</Text>
                  </View>
                  <Text style={styles.hoodScenarios}>{hood.scenarios.length} scenarios</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  welcomeCard: { backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.glowBorder, marginBottom: 24 },
  welcomeGreeting: { fontSize: 18, fontWeight: "700", color: Colors.glow, textAlign: "center", marginBottom: 12 },
  welcomeMeta: { flexDirection: "row", justifyContent: "center", gap: 20 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 14 },
  hoodCard: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: Colors.surfaceCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  hoodEmoji: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.glowSubtle, alignItems: "center", justifyContent: "center" },
  hoodInfo: { flex: 1, marginLeft: 14 },
  hoodName: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  hoodVibe: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  hoodMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  hoodDiff: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  hoodDiffText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  hoodScenarios: { fontSize: 11, color: Colors.textMuted },
  // Neighborhood detail
  descCard: { backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  descText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  diffBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  diffText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  tipCard: { backgroundColor: Colors.goldGlow, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.goldBorder, marginBottom: 20 },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  tipIcon: { fontSize: 18 },
  tipTitle: { fontSize: 14, fontWeight: "700", color: Colors.gold },
  tipText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  mustTryRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  mustTryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.secondary },
  mustTryText: { fontSize: 14, color: Colors.textPrimary },
  scenarioCard: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: Colors.surfaceCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  scenarioAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.glowSubtle, alignItems: "center", justifyContent: "center" },
  scenarioInfo: { flex: 1, marginLeft: 12 },
  scenarioTitle: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  scenarioCharacter: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  scenarioArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.glowSubtle, alignItems: "center", justifyContent: "center" },
});
