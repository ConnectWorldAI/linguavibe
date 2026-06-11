/**
 * Cultural Intelligence Engine
 * 
 * Not just words — teaching slang, body language context, cultural taboos,
 * and business etiquette per region. "Don't say this in Japan" type knowledge.
 * 
 * Features:
 * - Region-specific cultural cards (taboos, etiquette, body language)
 * - Slang dictionary with context and usage warnings
 * - Business etiquette guides per country
 * - Cultural faux pas alerts
 * - Interactive scenarios testing cultural knowledge
 */

import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CulturalRegion {
  id: string;
  country: string;
  flag: string;
  language: string;
  categories: CulturalCategory[];
}

interface CulturalCategory {
  id: string;
  title: string;
  icon: string;
  items: CulturalItem[];
}

interface CulturalItem {
  id: string;
  title: string;
  type: "taboo" | "etiquette" | "slang" | "body_language" | "tip";
  severity: "danger" | "warning" | "info";
  description: string;
  doSay?: string;
  dontSay?: string;
  context: string;
  region?: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const CULTURAL_REGIONS: CulturalRegion[] = [
  {
    id: "japan",
    country: "Japan",
    flag: "🇯🇵",
    language: "Japanese",
    categories: [
      {
        id: "taboos_jp",
        title: "Cultural Taboos",
        icon: "warning",
        items: [
          {
            id: "jp1",
            title: "Never stick chopsticks upright in rice",
            type: "taboo",
            severity: "danger",
            description: "This resembles incense at funerals and is considered extremely disrespectful. It's one of the biggest dining taboos in Japan.",
            context: "Dining",
            dontSay: "Sticking chopsticks vertically in a rice bowl",
            doSay: "Rest chopsticks on the chopstick rest (箸置き) or across your bowl",
          },
          {
            id: "jp2",
            title: "Don't tip at restaurants",
            type: "etiquette",
            severity: "warning",
            description: "Tipping is considered rude in Japan. It implies the service was so bad that you're offering charity. Good service is expected as standard.",
            context: "Dining & Services",
            dontSay: "Leaving money on the table as a tip",
            doSay: "Simply say ごちそうさまでした (gochisousama deshita) — 'Thank you for the meal'",
          },
          {
            id: "jp3",
            title: "Remove shoes before entering homes",
            type: "etiquette",
            severity: "danger",
            description: "Always remove shoes at the genkan (entryway). Wearing shoes inside is deeply offensive. Look for slippers provided by the host.",
            context: "Home visits, temples, some restaurants",
          },
          {
            id: "jp4",
            title: "Avoid the number 4",
            type: "taboo",
            severity: "warning",
            description: "四 (shi) sounds like 死 (death). Many buildings skip the 4th floor. Never give gifts in sets of 4.",
            context: "Gift giving, addresses",
          },
        ],
      },
      {
        id: "body_jp",
        title: "Body Language",
        icon: "body",
        items: [
          {
            id: "jp5",
            title: "Bowing depth matters",
            type: "body_language",
            severity: "info",
            description: "15° = casual greeting. 30° = business/respect. 45° = deep apology or extreme gratitude. Getting this wrong signals disrespect or over-familiarity.",
            context: "All social situations",
          },
          {
            id: "jp6",
            title: "Pointing with finger is rude",
            type: "body_language",
            severity: "warning",
            description: "Never point at people with your index finger. Use an open hand or nod in the direction instead.",
            context: "Public spaces",
          },
        ],
      },
      {
        id: "slang_jp",
        title: "Slang & Casual Speech",
        icon: "chatbox-ellipses",
        items: [
          {
            id: "jp7",
            title: "やばい (yabai) — Context is everything",
            type: "slang",
            severity: "info",
            description: "Originally meant 'dangerous/terrible' but young people use it for 'amazing/awesome' too. Context and tone determine meaning. Using it in formal settings is inappropriate.",
            context: "Casual conversation only",
            doSay: "このラーメンやばい！(This ramen is amazing!)",
            dontSay: "Using やばい in business meetings or with elders",
          },
          {
            id: "jp8",
            title: "草 (kusa) — Internet laugh",
            type: "slang",
            severity: "info",
            description: "Means 'grass' literally but used like 'lol' online because www (laughing) looks like grass. Only use in text/online, never spoken.",
            context: "Online/text only",
          },
        ],
      },
      {
        id: "business_jp",
        title: "Business Etiquette",
        icon: "briefcase",
        items: [
          {
            id: "jp9",
            title: "Business card exchange (名刺交換)",
            type: "etiquette",
            severity: "danger",
            description: "Present card with BOTH hands, Japanese side facing recipient. Receive with both hands, study it carefully, never write on it or put it in your back pocket. Place on table during meeting.",
            context: "Business meetings",
          },
          {
            id: "jp10",
            title: "Never say 'no' directly",
            type: "etiquette",
            severity: "warning",
            description: "Japanese business culture avoids direct refusal. 'That would be difficult' (ちょっと難しいですね) means NO. 'I'll consider it' (検討します) often means no. Learn to read between the lines.",
            context: "Negotiations, meetings",
            dontSay: "いいえ (No) directly to a proposal",
            doSay: "ちょっと検討させてください (Let me think about it)",
          },
        ],
      },
    ],
  },
  {
    id: "france",
    country: "France",
    flag: "🇫🇷",
    language: "French",
    categories: [
      {
        id: "taboos_fr",
        title: "Cultural Taboos",
        icon: "warning",
        items: [
          {
            id: "fr1",
            title: "Never use 'tu' with strangers",
            type: "taboo",
            severity: "danger",
            description: "Using 'tu' (informal you) instead of 'vous' (formal you) with someone you just met is considered extremely rude. Always default to 'vous' until invited to use 'tu'.",
            context: "All first meetings",
            dontSay: "Tu veux un café ? (to your boss)",
            doSay: "Vous voulez un café ? (formal)",
          },
          {
            id: "fr2",
            title: "Don't discuss money or salary",
            type: "taboo",
            severity: "warning",
            description: "Asking about someone's salary or the cost of their possessions is considered vulgar in French culture. It's one of the strongest social taboos.",
            context: "Social gatherings, dinner parties",
          },
          {
            id: "fr3",
            title: "La bise — cheek kissing rules vary by region",
            type: "etiquette",
            severity: "info",
            description: "1 kiss in Brittany, 2 in Paris, 3 in Provence, 4 in some northern areas. Starting on the wrong cheek or giving the wrong number is awkward but not offensive.",
            context: "Greetings between friends/acquaintances",
          },
        ],
      },
      {
        id: "slang_fr",
        title: "Slang & Verlan",
        icon: "chatbox-ellipses",
        items: [
          {
            id: "fr4",
            title: "Verlan — reversed syllable slang",
            type: "slang",
            severity: "info",
            description: "French youth reverse syllables: femme → meuf, bizarre → zarbi, louche → chelou. Using verlan with older people or in formal settings sounds very inappropriate.",
            context: "Youth culture, informal only",
            doSay: "C'est ouf ! (That's crazy! — from 'fou')",
            dontSay: "Using verlan in a job interview or with elders",
          },
          {
            id: "fr5",
            title: "Putain — the universal French word",
            type: "slang",
            severity: "warning",
            description: "Literally means 'prostitute' but used like 'damn/f***' for surprise, frustration, or emphasis. Extremely common but NEVER use in formal settings or with people you don't know well.",
            context: "Very informal only",
          },
        ],
      },
      {
        id: "business_fr",
        title: "Business Etiquette",
        icon: "briefcase",
        items: [
          {
            id: "fr6",
            title: "Lunch is sacred — never skip it",
            type: "etiquette",
            severity: "warning",
            description: "French business lunches last 1-2 hours minimum. Eating at your desk is frowned upon. Business is often discussed AFTER the meal, not during. Rushing through lunch signals disrespect.",
            context: "Business culture",
          },
          {
            id: "fr7",
            title: "Don't start with business talk",
            type: "etiquette",
            severity: "info",
            description: "French professionals expect small talk about culture, food, or travel before getting to business. Jumping straight to the agenda is seen as rude and 'too American'.",
            context: "Business meetings",
          },
        ],
      },
    ],
  },
  {
    id: "brazil",
    country: "Brazil",
    flag: "🇧🇷",
    language: "Portuguese",
    categories: [
      {
        id: "taboos_br",
        title: "Cultural Taboos",
        icon: "warning",
        items: [
          {
            id: "br1",
            title: "The OK gesture means something VERY different",
            type: "taboo",
            severity: "danger",
            description: "The 👌 OK hand gesture is equivalent to the middle finger in Brazil. It's extremely offensive. Use thumbs up (👍) instead — Brazilians love it.",
            context: "All situations",
            dontSay: "Making the OK sign with your hand",
            doSay: "Give a thumbs up or say 'Beleza!' (All good!)",
          },
          {
            id: "br2",
            title: "Don't compare Brazil to other Latin American countries",
            type: "taboo",
            severity: "warning",
            description: "Brazil speaks Portuguese, not Spanish. Saying 'It's like Mexico/Argentina' is offensive. Brazil has its own distinct culture, music, and identity.",
            context: "Conversation",
          },
        ],
      },
      {
        id: "slang_br",
        title: "Brazilian Slang",
        icon: "chatbox-ellipses",
        items: [
          {
            id: "br3",
            title: "Gírias that change by city",
            type: "slang",
            severity: "info",
            description: "São Paulo: 'mano' (bro). Rio: 'mermão'. Bahia: 'véi'. Using the wrong regional slang marks you as an outsider immediately.",
            context: "Casual conversation",
            doSay: "In SP: 'E aí, mano?' / In Rio: 'E aí, mermão?'",
          },
          {
            id: "br4",
            title: "Saudade — untranslatable emotion",
            type: "slang",
            severity: "info",
            description: "A deep emotional state of nostalgic longing for something or someone you love that is absent. No English equivalent. Using it correctly shows deep cultural understanding.",
            context: "Emotional expression",
            doSay: "Estou com saudade de você (I miss you — but deeper)",
          },
        ],
      },
      {
        id: "body_br",
        title: "Body Language",
        icon: "body",
        items: [
          {
            id: "br5",
            title: "Personal space is much closer",
            type: "body_language",
            severity: "info",
            description: "Brazilians stand very close when talking, touch arms/shoulders frequently, and hug even acquaintances. Stepping back signals coldness or rejection.",
            context: "All social situations",
          },
          {
            id: "br6",
            title: "Figa gesture for good luck",
            type: "body_language",
            severity: "info",
            description: "Thumb between index and middle finger = good luck charm. You'll see it as jewelry and hand gestures. It's positive, not offensive (unlike in some other cultures).",
            context: "Superstition, casual",
          },
        ],
      },
    ],
  },
  {
    id: "mexico",
    country: "Mexico",
    flag: "🇲🇽",
    language: "Spanish",
    categories: [
      {
        id: "taboos_mx",
        title: "Cultural Taboos",
        icon: "warning",
        items: [
          {
            id: "mx1",
            title: "Never refuse food from a host",
            type: "taboo",
            severity: "warning",
            description: "Refusing food when visiting someone's home is considered very rude. Even if you're full, take a small portion and compliment the cooking.",
            context: "Home visits, family gatherings",
          },
          {
            id: "mx2",
            title: "Don't call yourself 'American'",
            type: "taboo",
            severity: "warning",
            description: "Mexicans (and all Latin Americans) are also 'Americans'. Say 'estadounidense' (from the United States) or 'norteamericano' instead of 'americano'.",
            context: "Conversation about nationality",
            dontSay: "Soy americano",
            doSay: "Soy estadounidense / Soy de Estados Unidos",
          },
        ],
      },
      {
        id: "slang_mx",
        title: "Mexican Slang",
        icon: "chatbox-ellipses",
        items: [
          {
            id: "mx3",
            title: "Güey — the universal Mexican word",
            type: "slang",
            severity: "info",
            description: "Means 'dude/bro' and is used constantly in casual speech. Originally an insult (meaning 'ox/stupid'), now it's affectionate between friends. NEVER use with elders or in formal settings.",
            context: "Friends, casual only",
            doSay: "¿Qué onda, güey? (What's up, dude?)",
            dontSay: "Using güey with your boss or elderly people",
          },
          {
            id: "mx4",
            title: "No mames — strong but common",
            type: "slang",
            severity: "warning",
            description: "Literally vulgar but used like 'No way!' or 'You're kidding!' Extremely common among young people but offensive in formal settings or around children.",
            context: "Very informal only",
          },
        ],
      },
    ],
  },
  {
    id: "korea",
    country: "South Korea",
    flag: "🇰🇷",
    language: "Korean",
    categories: [
      {
        id: "taboos_kr",
        title: "Cultural Taboos",
        icon: "warning",
        items: [
          {
            id: "kr1",
            title: "Never write names in red ink",
            type: "taboo",
            severity: "danger",
            description: "Writing someone's name in red ink means you wish them dead. Red ink is reserved for deceased people's names. Always use black or blue.",
            context: "Writing, gift cards",
          },
          {
            id: "kr2",
            title: "Age hierarchy is everything",
            type: "etiquette",
            severity: "danger",
            description: "Korean has 7 speech levels based on age/status. Using the wrong level is deeply offensive. When meeting someone, age is asked immediately to establish the correct speech level.",
            context: "All interactions",
            dontSay: "Using 반말 (casual speech) with someone older",
            doSay: "Default to 존댓말 (formal speech) until told otherwise",
          },
          {
            id: "kr3",
            title: "Pour drinks with two hands",
            type: "etiquette",
            severity: "warning",
            description: "When pouring a drink for someone older, use both hands or support your pouring arm with your other hand. One-handed pouring to elders is disrespectful.",
            context: "Drinking, dining",
          },
        ],
      },
      {
        id: "slang_kr",
        title: "Korean Slang (신조어)",
        icon: "chatbox-ellipses",
        items: [
          {
            id: "kr4",
            title: "대박 (daebak) — Awesome/Jackpot",
            type: "slang",
            severity: "info",
            description: "The most common Korean exclamation. Used for anything surprising or impressive. Safe to use in most casual situations but not in formal business.",
            context: "Casual, K-drama watching",
            doSay: "대박! 진짜? (Awesome! Really?)",
          },
          {
            id: "kr5",
            title: "TMI culture — Koreans share a LOT",
            type: "tip",
            severity: "info",
            description: "Koreans openly ask about age, salary, relationship status, and blood type. This isn't rude — it's how they calibrate social dynamics. Don't be offended, participate!",
            context: "Getting to know people",
          },
        ],
      },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function CulturalIntelligenceScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<CulturalRegion | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CulturalCategory | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "danger": return colors.error;
      case "warning": return colors.warning;
      default: return colors.primary;
    }
  };

  const getSeverityIcon = (severity: string): any => {
    switch (severity) {
      case "danger": return "close-circle";
      case "warning": return "alert-circle";
      default: return "information-circle";
    }
  };

  const renderCulturalItem = ({ item }: { item: CulturalItem }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.itemHeader}>
        <Ionicons name={getSeverityIcon(item.severity)} size={18} color={getSeverityColor(item.severity)} />
        <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
      </View>
      <Text style={[styles.itemDescription, { color: colors.muted }]}>{item.description}</Text>
      
      {item.context && (
        <View style={[styles.contextBadge, { backgroundColor: colors.primary + "10" }]}>
          <Ionicons name="location" size={12} color={colors.primary} />
          <Text style={[styles.contextText, { color: colors.primary }]}>{item.context}</Text>
        </View>
      )}

      {(item.doSay || item.dontSay) && (
        <View style={styles.dosDonts}>
          {item.dontSay && (
            <View style={[styles.dontBox, { backgroundColor: colors.error + "08", borderColor: colors.error + "30" }]}>
              <Text style={[styles.dosLabel, { color: colors.error }]}>✗ Don't</Text>
              <Text style={[styles.dosText, { color: colors.foreground }]}>{item.dontSay}</Text>
            </View>
          )}
          {item.doSay && (
            <View style={[styles.doBox, { backgroundColor: colors.success + "08", borderColor: colors.success + "30" }]}>
              <Text style={[styles.dosLabel, { color: colors.success }]}>✓ Do</Text>
              <Text style={[styles.dosText, { color: colors.foreground }]}>{item.doSay}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  // ─── Category Detail View ──────────────────────────────────────────────────

  if (selectedCategory && selectedRegion) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{selectedCategory.title}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{selectedRegion.flag} {selectedRegion.country}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <FlatList
          data={selectedCategory.items}
          renderItem={renderCulturalItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </ScreenContainer>
    );
  }

  // ─── Region Detail View ────────────────────────────────────────────────────

  if (selectedRegion) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedRegion(null)} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {selectedRegion.flag} {selectedRegion.country}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.regionIntro, { color: colors.muted }]}>
            Cultural intelligence for {selectedRegion.country}. Learn what textbooks never teach you.
          </Text>
          {selectedRegion.categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIconWrap, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name={cat.icon as any} size={22} color={colors.primary} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.foreground }]}>{cat.title}</Text>
                <Text style={[styles.categoryCount, { color: colors.muted }]}>{cat.items.length} insights</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Region Selection View ─────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Cultural Intelligence</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={[styles.introTitle, { color: colors.foreground }]}>
            Beyond Words
          </Text>
          <Text style={[styles.introSubtitle, { color: colors.muted }]}>
            Learn the unwritten rules that textbooks ignore — slang, body language, taboos, and business etiquette that separate tourists from insiders.
          </Text>
        </View>

        {/* Region Cards */}
        {CULTURAL_REGIONS.map((region) => {
          const totalItems = region.categories.reduce((sum, cat) => sum + cat.items.length, 0);
          const dangerCount = region.categories.reduce(
            (sum, cat) => sum + cat.items.filter((i) => i.severity === "danger").length, 0
          );

          return (
            <TouchableOpacity
              key={region.id}
              style={[styles.regionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setSelectedRegion(region)}
              activeOpacity={0.7}
            >
              <Text style={styles.regionFlag}>{region.flag}</Text>
              <View style={styles.regionInfo}>
                <Text style={[styles.regionName, { color: colors.foreground }]}>{region.country}</Text>
                <Text style={[styles.regionLang, { color: colors.muted }]}>{region.language}</Text>
                <View style={styles.regionStats}>
                  <Text style={[styles.regionStatText, { color: colors.muted }]}>
                    {totalItems} insights
                  </Text>
                  {dangerCount > 0 && (
                    <View style={[styles.dangerBadge, { backgroundColor: colors.error + "15" }]}>
                      <Ionicons name="alert-circle" size={10} color={colors.error} />
                      <Text style={[styles.dangerText, { color: colors.error }]}>
                        {dangerCount} critical
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerCenter: { alignItems: "center" },
  headerSubtitle: { fontSize: 12 },
  listContent: { padding: 16, gap: 12, paddingBottom: 100 },
  introSection: { marginBottom: 8 },
  introTitle: { fontSize: 24, fontWeight: "800" },
  introSubtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  regionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 0.5,
    gap: 14,
  },
  regionFlag: { fontSize: 36 },
  regionInfo: { flex: 1, gap: 2 },
  regionName: { fontSize: 17, fontWeight: "700" },
  regionLang: { fontSize: 12 },
  regionStats: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  regionStatText: { fontSize: 11 },
  dangerBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  dangerText: { fontSize: 10, fontWeight: "600" },
  regionIntro: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    gap: 12,
  },
  categoryIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  categoryInfo: { flex: 1, gap: 2 },
  categoryName: { fontSize: 15, fontWeight: "600" },
  categoryCount: { fontSize: 12 },
  itemCard: { borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 8 },
  itemHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  itemTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  itemDescription: { fontSize: 13, lineHeight: 19 },
  contextBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  contextText: { fontSize: 11, fontWeight: "500" },
  dosDonts: { gap: 6, marginTop: 4 },
  dontBox: { padding: 10, borderRadius: 8, borderWidth: 0.5 },
  doBox: { padding: 10, borderRadius: 8, borderWidth: 0.5 },
  dosLabel: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  dosText: { fontSize: 13 },
});
