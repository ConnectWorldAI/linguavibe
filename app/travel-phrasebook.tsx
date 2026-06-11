import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type Destination = {
  id: string;
  city: string;
  country: string;
  flag: string;
  language: string;
  image: string;
  phrasePacks: PhrasePack[];
  downloaded: boolean;
};

type PhrasePack = {
  id: string;
  category: string;
  icon: string;
  phrases: { original: string; translation: string; pronunciation: string }[];
};

const DESTINATIONS: Destination[] = [
  {
    id: "1", city: "Barcelona", country: "Spain", flag: "🇪🇸", language: "Spanish", image: "🏰", downloaded: true,
    phrasePacks: [
      { id: "1a", category: "Getting Around", icon: "🚇", phrases: [
        { original: "¿Dónde está la estación de metro?", translation: "Where is the metro station?", pronunciation: "DON-deh es-TAH lah es-tah-see-OHN deh MEH-troh" },
        { original: "¿Cuánto cuesta un billete?", translation: "How much is a ticket?", pronunciation: "KWAHN-toh KWES-tah oon bee-YEH-teh" },
        { original: "Lléveme a esta dirección, por favor", translation: "Take me to this address, please", pronunciation: "YEH-veh-meh ah ES-tah dee-rek-see-OHN por fah-VOR" },
      ]},
      { id: "1b", category: "Food & Dining", icon: "🍽️", phrases: [
        { original: "Una mesa para dos, por favor", translation: "A table for two, please", pronunciation: "OO-nah MEH-sah PAH-rah dohs por fah-VOR" },
        { original: "¿Qué me recomienda?", translation: "What do you recommend?", pronunciation: "keh meh reh-koh-mee-EN-dah" },
        { original: "La cuenta, por favor", translation: "The check, please", pronunciation: "lah KWEN-tah por fah-VOR" },
      ]},
      { id: "1c", category: "Emergencies", icon: "🚨", phrases: [
        { original: "Necesito ayuda", translation: "I need help", pronunciation: "neh-seh-SEE-toh ah-YOO-dah" },
        { original: "¿Dónde está el hospital?", translation: "Where is the hospital?", pronunciation: "DON-deh es-TAH el os-pee-TAHL" },
      ]},
    ],
  },
  {
    id: "2", city: "Tokyo", country: "Japan", flag: "🇯🇵", language: "Japanese", image: "⛩️", downloaded: false,
    phrasePacks: [
      { id: "2a", category: "Getting Around", icon: "🚇", phrases: [
        { original: "すみません、駅はどこですか？", translation: "Excuse me, where is the station?", pronunciation: "su-mi-ma-sen, eki wa doko desu ka?" },
        { original: "この電車は渋谷に行きますか？", translation: "Does this train go to Shibuya?", pronunciation: "kono densha wa Shibuya ni ikimasu ka?" },
      ]},
      { id: "2b", category: "Food & Dining", icon: "🍽️", phrases: [
        { original: "メニューをお願いします", translation: "Menu, please", pronunciation: "menyu wo onegai shimasu" },
        { original: "おすすめは何ですか？", translation: "What do you recommend?", pronunciation: "osusume wa nan desu ka?" },
      ]},
    ],
  },
  {
    id: "3", city: "Paris", country: "France", flag: "🇫🇷", language: "French", image: "🗼", downloaded: false,
    phrasePacks: [
      { id: "3a", category: "Getting Around", icon: "🚇", phrases: [
        { original: "Où est la station de métro?", translation: "Where is the metro station?", pronunciation: "oo eh lah stah-see-OHN duh meh-TROH" },
        { original: "Je voudrais aller à...", translation: "I would like to go to...", pronunciation: "zhuh voo-DREH ah-LAY ah" },
      ]},
      { id: "3b", category: "Shopping", icon: "🛍️", phrases: [
        { original: "Combien ça coûte?", translation: "How much does it cost?", pronunciation: "kohm-bee-EN sah KOOT" },
        { original: "Je regarde seulement", translation: "I'm just looking", pronunciation: "zhuh reh-GARD suhl-MOHN" },
      ]},
    ],
  },
  {
    id: "4", city: "Seoul", country: "South Korea", flag: "🇰🇷", language: "Korean", image: "🏯", downloaded: false,
    phrasePacks: [
      { id: "4a", category: "Getting Around", icon: "🚇", phrases: [
        { original: "지하철역이 어디에 있어요?", translation: "Where is the subway station?", pronunciation: "ji-ha-cheol-yeog-i eo-di-e iss-eo-yo?" },
      ]},
      { id: "4b", category: "Food & Dining", icon: "🍽️", phrases: [
        { original: "메뉴 주세요", translation: "Menu please", pronunciation: "me-nyu ju-se-yo" },
        { original: "맛있어요!", translation: "It's delicious!", pronunciation: "mas-iss-eo-yo!" },
      ]},
    ],
  },
];

export default function TravelPhrasebookScreen() {
  const colors = useColors();
  const [selectedDest, setSelectedDest] = useState<Destination | null>(DESTINATIONS[0]);
  const [expandedPack, setExpandedPack] = useState<string | null>("1a");

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Travel Phrasebook</Text>
        <TouchableOpacity>
          <Ionicons name="download-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Destination Picker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destRow}>
          {DESTINATIONS.map((dest) => (
            <TouchableOpacity
              key={dest.id}
              style={[styles.destCard, {
                backgroundColor: selectedDest?.id === dest.id ? colors.primary + "15" : colors.surface,
                borderColor: selectedDest?.id === dest.id ? colors.primary : colors.border,
              }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDest(dest);
                setExpandedPack(null);
              }}
            >
              <Text style={styles.destImage}>{dest.image}</Text>
              <Text style={[styles.destCity, { color: selectedDest?.id === dest.id ? colors.primary : colors.foreground }]}>{dest.city}</Text>
              <Text style={[styles.destFlag, { color: colors.muted }]}>{dest.flag} {dest.language}</Text>
              {dest.downloaded && (
                <View style={[styles.downloadedBadge, { backgroundColor: colors.success + "15" }]}>
                  <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Phrase Packs */}
        {selectedDest && (
          <View style={styles.packsSection}>
            <View style={styles.packHeader}>
              <Text style={[styles.packSectionTitle, { color: colors.foreground }]}>
                {selectedDest.flag} {selectedDest.city} Phrases
              </Text>
              {!selectedDest.downloaded && (
                <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: colors.primary }]}>
                  <Ionicons name="download" size={12} color="#FFF" />
                  <Text style={styles.downloadBtnText}>Offline</Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedDest.phrasePacks.map((pack) => (
              <View key={pack.id} style={[styles.packCard, { backgroundColor: colors.surface, borderColor: expandedPack === pack.id ? colors.primary : colors.border }]}>
                <TouchableOpacity
                  style={styles.packTitle}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setExpandedPack(expandedPack === pack.id ? null : pack.id);
                  }}
                >
                  <View style={styles.packLeft}>
                    <Text style={{ fontSize: 20 }}>{pack.icon}</Text>
                    <Text style={[styles.packName, { color: colors.foreground }]}>{pack.category}</Text>
                    <View style={[styles.phraseCount, { backgroundColor: colors.primary + "10" }]}>
                      <Text style={[styles.phraseCountText, { color: colors.primary }]}>{pack.phrases.length}</Text>
                    </View>
                  </View>
                  <Ionicons name={expandedPack === pack.id ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
                </TouchableOpacity>

                {expandedPack === pack.id && (
                  <View style={[styles.phrasesContainer, { borderTopColor: colors.border }]}>
                    {pack.phrases.map((phrase, i) => (
                      <View key={i} style={[styles.phraseItem, { borderBottomColor: i < pack.phrases.length - 1 ? colors.border : "transparent" }]}>
                        <Text style={[styles.phraseOriginal, { color: colors.foreground }]}>{phrase.original}</Text>
                        <Text style={[styles.phraseTranslation, { color: colors.muted }]}>{phrase.translation}</Text>
                        <View style={styles.pronunciationRow}>
                          <Ionicons name="volume-medium" size={14} color={colors.primary} />
                          <Text style={[styles.pronunciationText, { color: colors.primary }]}>{phrase.pronunciation}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 100 },
  destRow: { gap: 10, paddingBottom: 16 },
  destCard: { width: 100, padding: 12, borderRadius: 12, borderWidth: 1.5, alignItems: "center", position: "relative" },
  destImage: { fontSize: 28, marginBottom: 4 },
  destCity: { fontSize: 12, fontWeight: "700" },
  destFlag: { fontSize: 10, marginTop: 2 },
  downloadedBadge: { position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  packsSection: { marginTop: 4 },
  packHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  packSectionTitle: { fontSize: 16, fontWeight: "700" },
  downloadBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  downloadBtnText: { fontSize: 11, fontWeight: "700", color: "#FFF" },
  packCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  packTitle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  packLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  packName: { fontSize: 14, fontWeight: "700" },
  phraseCount: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  phraseCountText: { fontSize: 10, fontWeight: "800" },
  phrasesContainer: { borderTopWidth: 0.5, paddingHorizontal: 14 },
  phraseItem: { paddingVertical: 12, borderBottomWidth: 0.5 },
  phraseOriginal: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  phraseTranslation: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  pronunciationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  pronunciationText: { fontSize: 11, fontStyle: "italic" },
});
