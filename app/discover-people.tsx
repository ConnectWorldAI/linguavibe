import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type FilterCategory = "all" | "language" | "teachers" | "nearby" | "classmates";

type Person = {
  id: string;
  name: string;
  avatar: string;
  flag: string;
  headline: string;
  nativeLanguage: string;
  learningLanguage: string;
  mutualConnections: number;
  isVerified: boolean;
  isTeacher: boolean;
  matchScore: number;
  location: string;
};

const MOCK_PEOPLE: Person[] = [
  { id: "1", name: "Carlos Méndez", avatar: "👨‍💼", flag: "🇲🇽", headline: "Software Engineer learning English", nativeLanguage: "Spanish", learningLanguage: "English", mutualConnections: 8, isVerified: false, isTeacher: false, matchScore: 95, location: "Mexico City" },
  { id: "2", name: "Profesora Ana", avatar: "👩‍🏫", flag: "🇪🇸", headline: "Certified Spanish Teacher | DELE Examiner", nativeLanguage: "Spanish", learningLanguage: "Japanese", mutualConnections: 23, isVerified: true, isTeacher: true, matchScore: 92, location: "Madrid" },
  { id: "3", name: "Yuki Tanaka", avatar: "👩", flag: "🇯🇵", headline: "University student learning Spanish", nativeLanguage: "Japanese", learningLanguage: "Spanish", mutualConnections: 3, isVerified: false, isTeacher: false, matchScore: 88, location: "Tokyo" },
  { id: "4", name: "Jean-Pierre Dubois", avatar: "👨", flag: "🇫🇷", headline: "Chef | Passionate about languages", nativeLanguage: "French", learningLanguage: "English", mutualConnections: 5, isVerified: false, isTeacher: false, matchScore: 85, location: "Paris" },
  { id: "5", name: "Prof. Kwame Asante", avatar: "👨‍🎓", flag: "🇬🇭", headline: "Linguistics Professor | Twi & English", nativeLanguage: "Twi", learningLanguage: "Spanish", mutualConnections: 15, isVerified: true, isTeacher: true, matchScore: 82, location: "Accra" },
  { id: "6", name: "Maria Santos", avatar: "👩‍💻", flag: "🇧🇷", headline: "UX Designer | Portuguese native", nativeLanguage: "Portuguese", learningLanguage: "Korean", mutualConnections: 2, isVerified: false, isTeacher: false, matchScore: 78, location: "São Paulo" },
  { id: "7", name: "Ahmed Hassan", avatar: "👨‍⚕️", flag: "🇪🇬", headline: "Doctor learning German for residency", nativeLanguage: "Arabic", learningLanguage: "German", mutualConnections: 7, isVerified: false, isTeacher: false, matchScore: 75, location: "Cairo" },
  { id: "8", name: "Soo-Jin Park", avatar: "👩‍🎤", flag: "🇰🇷", headline: "K-pop vocal coach | Teaches Korean", nativeLanguage: "Korean", learningLanguage: "English", mutualConnections: 31, isVerified: true, isTeacher: true, matchScore: 90, location: "Seoul" },
];

const FILTERS: { key: FilterCategory; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "people-outline" },
  { key: "language", label: "By Language", icon: "language-outline" },
  { key: "teachers", label: "Teachers", icon: "school-outline" },
  { key: "nearby", label: "Nearby", icon: "location-outline" },
  { key: "classmates", label: "Classmates", icon: "book-outline" },
];

export default function DiscoverPeopleScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const filteredPeople = MOCK_PEOPLE.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.headline.toLowerCase().includes(q) || p.nativeLanguage.toLowerCase().includes(q) || p.learningLanguage.toLowerCase().includes(q);
    }
    if (activeFilter === "teachers") return p.isTeacher;
    return true;
  });

  const handleFollow = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderPerson = ({ item }: { item: Person }) => {
    const isFollowed = followedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.personCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: "/user-profile", params: { userId: item.id, name: item.name } })}
      >
        <View style={styles.personHeader}>
          <View style={[styles.personAvatar, { backgroundColor: colors.background }]}>
            <Text style={styles.personAvatarText}>{item.avatar}</Text>
            {item.isVerified && (
              <View style={[styles.verifiedDot, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={8} color="#FFF" />
              </View>
            )}
          </View>
          <View style={styles.personInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.personName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={styles.personFlag}>{item.flag}</Text>
            </View>
            <Text style={[styles.personHeadline, { color: colors.muted }]} numberOfLines={1}>{item.headline}</Text>
            <View style={styles.metaRow}>
              <View style={styles.matchBadge}>
                <Ionicons name="flash" size={10} color="#FFD700" />
                <Text style={styles.matchText}>{item.matchScore}%</Text>
              </View>
              {item.mutualConnections > 0 && (
                <Text style={[styles.mutualText, { color: colors.muted }]}>
                  {item.mutualConnections} mutual
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.followBtn,
              {
                backgroundColor: isFollowed ? colors.surface : colors.primary,
                borderColor: isFollowed ? colors.border : colors.primary,
              },
            ]}
            onPress={() => handleFollow(item.id)}
          >
            <Text style={[styles.followBtnText, { color: isFollowed ? colors.foreground : "#FFFFFF" }]}>
              {isFollowed ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Language Exchange */}
        <View style={styles.langExchange}>
          <View style={[styles.langTag, { backgroundColor: "#4ADE8015" }]}>
            <Text style={styles.langTagText}>Speaks {item.nativeLanguage}</Text>
          </View>
          <Ionicons name="swap-horizontal" size={14} color={colors.muted} />
          <View style={[styles.langTag, { backgroundColor: "#6C5CE715" }]}>
            <Text style={[styles.langTagText, { color: "#6C5CE7" }]}>Learning {item.learningLanguage}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  // Load persisted data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@discover_people_data');
        if (stored) {
          // Data available from sync/server
        }
      } catch {}
    })();
  }, []);
  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Discover People</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by name, language, interest..."
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

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === filter.key ? colors.primary + "15" : colors.surface,
                borderColor: activeFilter === filter.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveFilter(filter.key);
            }}
          >
            <Ionicons name={filter.icon as any} size={14} color={activeFilter === filter.key ? colors.primary : colors.muted} />
            <Text style={[styles.filterText, { color: activeFilter === filter.key ? colors.primary : colors.muted }]}>{filter.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <FlatList
        data={filteredPeople}
        renderItem={renderPerson}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <Text style={[styles.resultCount, { color: colors.muted }]}>
            {filteredPeople.length} people found
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results</Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>Try a different search or filter</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  searchContainer: { paddingHorizontal: 16, paddingTop: 12 },
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  filtersScroll: { maxHeight: 50, marginTop: 10 },
  filtersContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: "600" },
  listContent: { padding: 16 },
  resultCount: { fontSize: 13, marginBottom: 12 },
  personCard: { padding: 14, borderRadius: 14, borderWidth: 1 },
  personHeader: { flexDirection: "row", alignItems: "center" },
  personAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  personAvatarText: { fontSize: 22 },
  verifiedDot: { position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  personInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  personName: { fontSize: 15, fontWeight: "700" },
  personFlag: { fontSize: 14 },
  personHeadline: { fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  matchBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  matchText: { fontSize: 11, fontWeight: "700", color: "#FFD700" },
  mutualText: { fontSize: 11 },
  followBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  followBtnText: { fontSize: 12, fontWeight: "700" },
  langExchange: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: "#33333320" },
  langTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  langTagText: { fontSize: 11, fontWeight: "600", color: "#4ADE80" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyDesc: { fontSize: 14 },
});
