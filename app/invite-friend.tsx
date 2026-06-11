import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type Contact = {
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
  color: string;
  invited: boolean;
};

// Sample contacts (in production would come from device contacts)
const SAMPLE_CONTACTS: Contact[] = [
  { id: "1", name: "Alex Rivera", avatar: null, initials: "AR", color: "#6C5CE7", invited: false },
  { id: "2", name: "Bella Chen", avatar: null, initials: "BC", color: "#E17055", invited: false },
  { id: "3", name: "Carlos Diaz", avatar: null, initials: "CD", color: "#00B894", invited: false },
  { id: "4", name: "Diana Park", avatar: null, initials: "DP", color: "#FDCB6E", invited: false },
  { id: "5", name: "Eduardo Silva", avatar: null, initials: "ES", color: "#0984E3", invited: false },
  { id: "6", name: "Fatima Hassan", avatar: null, initials: "FH", color: "#E84393", invited: false },
  { id: "7", name: "Gabriel Moreau", avatar: null, initials: "GM", color: "#00CEC9", invited: false },
  { id: "8", name: "Hannah Kim", avatar: null, initials: "HK", color: "#A29BFE", invited: false },
  { id: "9", name: "Ivan Petrov", avatar: null, initials: "IP", color: "#55A3F5", invited: false },
  { id: "10", name: "Julia Santos", avatar: null, initials: "JS", color: "#FF7675", invited: false },
  { id: "11", name: "Kenji Tanaka", avatar: null, initials: "KT", color: "#74B9FF", invited: false },
  { id: "12", name: "Lena Mueller", avatar: null, initials: "LM", color: "#81ECEC", invited: false },
  { id: "13", name: "Marco Rossi", avatar: null, initials: "MR", color: "#FAB1A0", invited: false },
  { id: "14", name: "Nina Okafor", avatar: null, initials: "NO", color: "#DFE6E9", invited: false },
  { id: "15", name: "Omar Khalil", avatar: null, initials: "OK", color: "#636E72", invited: false },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function InviteFriendScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>(SAMPLE_CONTACTS);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group contacts by first letter
  const groupedContacts = filteredContacts.reduce<Record<string, Contact[]>>((acc, contact) => {
    const letter = contact.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {});

  const sections = Object.keys(groupedContacts).sort().map((letter) => ({
    letter,
    data: groupedContacts[letter],
  }));

  const handleShareLink = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: "Hey! I'm learning languages on ConnectWorld AI — it's like having a personal tutor that actually speaks slang. Join me: https://connectworld.ai/invite/abc123",
        title: "Join me on ConnectWorld AI",
      });
    } catch {}
  };

  const handleInviteContact = (contactId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, invited: true } : c))
    );
    const contact = contacts.find((c) => c.id === contactId);
    Alert.alert("Invite Sent!", `An invitation has been sent to ${contact?.name || "your friend"}.`);
  };

  const s = createStyles(colors);

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={s.contactRow}
      onPress={() => !item.invited && handleInviteContact(item.id)}
      activeOpacity={item.invited ? 1 : 0.7}
    >
      <View style={[s.avatar, { backgroundColor: item.color + "25" }]}>
        <Text style={[s.avatarText, { color: item.color }]}>{item.initials}</Text>
      </View>
      <Text style={s.contactName}>{item.name}</Text>
      {item.invited && (
        <View style={[s.invitedBadge, { backgroundColor: colors.success + "15" }]}>
          <Ionicons name="checkmark" size={14} color={colors.success} />
          <Text style={[s.invitedText, { color: colors.success }]}>Invited</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = (letter: string) => (
    <View style={s.sectionHeader} key={`header-${letter}`}>
      <Text style={s.sectionLetter}>{letter}</Text>
    </View>
  );

  // Flatten sections for FlatList
  const flatData: (Contact | { type: "header"; letter: string })[] = [];
  sections.forEach((section) => {
    flatData.push({ type: "header", letter: section.letter } as any);
    section.data.forEach((c) => flatData.push(c));
  });

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Invite a Friend</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={s.searchContainer}>
        <View style={[s.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={[s.searchInput, { color: colors.foreground }]}
            placeholder="Search"
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="done"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Share Link Card */}
      <View style={[s.shareCard, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={s.shareRow} onPress={handleShareLink} activeOpacity={0.7}>
          <View style={[s.shareIcon, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="share-social" size={20} color={colors.primary} />
          </View>
          <View style={s.shareTextContainer}>
            <Text style={s.shareTitle}>Share invite link</Text>
            <Text style={s.shareSubtitle}>Anyone with the link can join ConnectWorld AI</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Contacts List */}
      <Text style={s.listTitle}>Start learning together</Text>

      <FlatList
        data={flatData}
        keyExtractor={(item: any) => item.type === "header" ? `h-${item.letter}` : item.id}
        renderItem={({ item }: any) => {
          if (item.type === "header") {
            return renderSectionHeader(item.letter);
          }
          return renderContact({ item });
        }}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Alphabet Index */}
      <View style={s.alphabetIndex}>
        {ALPHABET.map((letter) => (
          <Text key={letter} style={[s.alphabetLetter, { color: colors.primary }]}>
            {letter}
          </Text>
        ))}
      </View>
    </ScreenContainer>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: { width: 40, height: 40, justifyContent: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground },
    searchContainer: { paddingHorizontal: 16, marginBottom: 12 },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15 },
    shareCard: {
      marginHorizontal: 16,
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
    },
    shareRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    shareIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    shareTextContainer: { flex: 1 },
    shareTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground },
    shareSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
    listTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    listContent: { paddingHorizontal: 16, paddingBottom: 40 },
    sectionHeader: { paddingVertical: 6, paddingTop: 12 },
    sectionLetter: { fontSize: 14, fontWeight: "700", color: colors.muted },
    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      gap: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: { fontSize: 14, fontWeight: "700" },
    contactName: { flex: 1, fontSize: 15, fontWeight: "500", color: colors.foreground },
    invitedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    invitedText: { fontSize: 12, fontWeight: "600" },
    alphabetIndex: {
      position: "absolute",
      right: 4,
      top: 180,
      bottom: 40,
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 4,
    },
    alphabetLetter: { fontSize: 9, fontWeight: "700" },
  });
}
