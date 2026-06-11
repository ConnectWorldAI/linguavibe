import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "@connectworld_favorites";
const DELETED_KEY = "@connectworld_recently_deleted";

// ─── DATA TYPES ───
type FavoriteType = "contact" | "song" | "lesson";

interface FavoriteItem {
  id: string;
  type: FavoriteType;
  title: string;
  subtitle: string;
  image?: string;
  icon?: string;
  iconColor?: string;
  language?: string;
  languageFlag?: string;
  progress?: number;
  lastAccessed: string;
}

// ─── SAMPLE DATA ───
const FAVORITES: FavoriteItem[] = [
  // Contacts
  {
    id: "c1",
    type: "contact",
    title: "Maria García",
    subtitle: "Spanish • Online",
    language: "ES",
    languageFlag: "🇪🇸",
    lastAccessed: "2 min ago",
  },
  {
    id: "c2",
    type: "contact",
    title: "Yuki Tanaka",
    subtitle: "Japanese • Last seen 1h ago",
    language: "JP",
    languageFlag: "🇯🇵",
    lastAccessed: "1 hour ago",
  },
  {
    id: "c3",
    type: "contact",
    title: "Ahmed Hassan",
    subtitle: "Arabic • Online",
    language: "AR",
    languageFlag: "🇸🇦",
    lastAccessed: "5 min ago",
  },
  {
    id: "c4",
    type: "contact",
    title: "Sophie Dubois",
    subtitle: "French • Last seen 3h ago",
    language: "FR",
    languageFlag: "🇫🇷",
    lastAccessed: "3 hours ago",
  },
  // Songs
  {
    id: "s1",
    type: "song",
    title: "Titi Me Preguntó",
    subtitle: "Bad Bunny",
    language: "ES",
    languageFlag: "🇵🇷",
    icon: "musical-notes",
    iconColor: "#E040FB",
    lastAccessed: "Yesterday",
  },
  {
    id: "s2",
    type: "song",
    title: "Papaoutai",
    subtitle: "Stromae",
    language: "FR",
    languageFlag: "🇫🇷",
    icon: "musical-notes",
    iconColor: Colors.secondary,
    lastAccessed: "2 days ago",
  },
  {
    id: "s3",
    type: "song",
    title: "Lemon",
    subtitle: "Kenshi Yonezu",
    language: "JP",
    languageFlag: "🇯🇵",
    icon: "musical-notes",
    iconColor: Colors.gold,
    lastAccessed: "3 days ago",
  },
  {
    id: "s4",
    type: "song",
    title: "Despacito",
    subtitle: "Luis Fonsi ft. Daddy Yankee",
    language: "ES",
    languageFlag: "🇵🇷",
    icon: "musical-notes",
    iconColor: Colors.accent,
    lastAccessed: "1 week ago",
  },
  {
    id: "s5",
    type: "song",
    title: "99 Luftballons",
    subtitle: "Nena",
    language: "DE",
    languageFlag: "🇩🇪",
    icon: "musical-notes",
    iconColor: Colors.success,
    lastAccessed: "1 week ago",
  },
  // Lessons
  {
    id: "l1",
    type: "lesson",
    title: "Spanish Conversation Basics",
    subtitle: "AI Teacher • 12 modules",
    language: "ES",
    languageFlag: "🇪🇸",
    icon: "school",
    iconColor: Colors.secondary,
    progress: 0.75,
    lastAccessed: "Today",
  },
  {
    id: "l2",
    type: "lesson",
    title: "Japanese Kanji N5",
    subtitle: "Writing Practice • 8 modules",
    language: "JP",
    languageFlag: "🇯🇵",
    icon: "book",
    iconColor: Colors.gold,
    progress: 0.4,
    lastAccessed: "Yesterday",
  },
  {
    id: "l3",
    type: "lesson",
    title: "French Business Phrases",
    subtitle: "Professional • 6 modules",
    language: "FR",
    languageFlag: "🇫🇷",
    icon: "briefcase",
    iconColor: "#E040FB",
    progress: 0.9,
    lastAccessed: "2 days ago",
  },
  {
    id: "l4",
    type: "lesson",
    title: "Arabic Alphabet Mastery",
    subtitle: "Beginner • 10 modules",
    language: "AR",
    languageFlag: "🇸🇦",
    icon: "language",
    iconColor: Colors.success,
    progress: 0.2,
    lastAccessed: "4 days ago",
  },
];

type FilterKey = "all" | "contacts" | "songs" | "lessons";

const FILTERS: { key: FilterKey; label: string; icon: string; count: number }[] = [
  { key: "all", label: "All", icon: "heart", count: FAVORITES.length },
  { key: "contacts", label: "Contacts", icon: "people", count: FAVORITES.filter(f => f.type === "contact").length },
  { key: "songs", label: "Songs", icon: "musical-notes", count: FAVORITES.filter(f => f.type === "song").length },
  { key: "lessons", label: "Lessons", icon: "school", count: FAVORITES.filter(f => f.type === "lesson").length },
];

export default function FavoritesScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [favorites, setFavorites] = useState(FAVORITES);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<(FavoriteItem & { deletedAt: number })[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);

  // Undo toast
  const [undoItem, setUndoItem] = useState<FavoriteItem | null>(null);
  const undoToastAnim = useRef(new Animated.Value(100)).current;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showUndoToast = (item: FavoriteItem) => {
    setUndoItem(item);
    undoToastAnim.setValue(100);
    Animated.spring(undoToastAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      Animated.timing(undoToastAnim, { toValue: 100, duration: 250, useNativeDriver: true }).start(() => setUndoItem(null));
    }, 5000);
  };

  const handleUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (undoItem) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFavorites((prev) => [...prev, undoItem]);
      setRecentlyDeleted((prev) => prev.filter((d) => d.id !== undoItem.id));
    }
    Animated.timing(undoToastAnim, { toValue: 100, duration: 200, useNativeDriver: true }).start(() => setUndoItem(null));
  };

  // Load persisted data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedFavs = await AsyncStorage.getItem(FAVORITES_KEY);
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
        const savedDeleted = await AsyncStorage.getItem(DELETED_KEY);
        if (savedDeleted) {
          // Filter out items older than 30 days
          const parsed = JSON.parse(savedDeleted);
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const valid = parsed.filter((d: any) => d.deletedAt > thirtyDaysAgo);
          setRecentlyDeleted(valid);
        }
      } catch (e) {
        // Fallback to defaults
      }
    };
    loadData();
  }, []);

  // Persist favorites when they change
  useEffect(() => {
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)).catch(() => {});
  }, [favorites]);

  // Persist recently deleted
  useEffect(() => {
    AsyncStorage.setItem(DELETED_KEY, JSON.stringify(recentlyDeleted)).catch(() => {});
  }, [recentlyDeleted]);

  const filteredItems = favorites.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "contacts") return item.type === "contact";
    if (activeFilter === "songs") return item.type === "song";
    if (activeFilter === "lessons") return item.type === "lesson";
    return true;
  });

  const handleRemoveFavorite = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    const item = favorites.find((f) => f.id === id);
    setRemovingId(id);
    setTimeout(() => {
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      if (item) {
        setRecentlyDeleted((prev) => [{ ...item, deletedAt: Date.now() }, ...prev]);
        showUndoToast(item);
      }
      setRemovingId(null);
    }, 300);
  };

  const handleRestore = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const item = recentlyDeleted.find((d) => d.id === id);
    if (item) {
      const { deletedAt, ...restored } = item;
      setFavorites((prev) => [...prev, restored]);
      setRecentlyDeleted((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handlePermanentDelete = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setRecentlyDeleted((prev) => prev.filter((d) => d.id !== id));
  };

  const handleItemPress = (item: FavoriteItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (item.type === "song") {
      router.push("/song-player");
    } else if (item.type === "lesson") {
      router.push("/lesson-detail");
    }
  };

  const handleQuickAction = (action: string, item: FavoriteItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (action === "call") {
      router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave" } } as any);
    } else if (action === "message") {
      // Navigate to messages
    }
  };

  const renderContactCard = (item: FavoriteItem) => (
    <View key={item.id} style={styles.contactCard}>
      <View style={styles.contactAvatar}>
        <Text style={styles.contactAvatarText}>
          {item.title.split(" ").map(n => n[0]).join("")}
        </Text>
        <View style={styles.contactOnline} />
      </View>
      <View style={styles.contactInfo}>
        <View style={styles.contactNameRow}>
          <Text style={styles.contactName} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.contactFlag}>{item.languageFlag}</Text>
        </View>
        <Text style={styles.contactSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        <Text style={styles.contactTime}>{item.lastAccessed}</Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity
          style={styles.contactActionBtn}
          onPress={() => handleQuickAction("call", item)}
        >
          <Ionicons name="call" size={16} color={Colors.success} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactActionBtn}
          onPress={() => handleQuickAction("message", item)}
        >
          <Ionicons name="chatbubble" size={16} color={Colors.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSongCard = (item: FavoriteItem) => (
    <TouchableOpacity key={item.id} style={styles.songCard} onPress={() => handleItemPress(item)}>
      <View style={[styles.songIcon, { backgroundColor: (item.iconColor || Colors.secondary) + "18" }]}>
        <Ionicons name="musical-notes" size={22} color={item.iconColor || Colors.secondary} />
      </View>
      <View style={styles.songInfo}>
        <View style={styles.songTitleRow}>
          <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.songFlag}>{item.languageFlag}</Text>
        </View>
        <Text style={styles.songArtist} numberOfLines={1}>{item.subtitle}</Text>
        <Text style={styles.songTime}>{item.lastAccessed}</Text>
      </View>
      <TouchableOpacity style={styles.songPlayBtn} onPress={() => handleItemPress(item)}>
        <Ionicons name="play" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderLessonCard = (item: FavoriteItem) => (
    <TouchableOpacity key={item.id} style={styles.lessonCard} onPress={() => handleItemPress(item)}>
      <View style={[styles.lessonIcon, { backgroundColor: (item.iconColor || Colors.secondary) + "18" }]}>
        <Ionicons name={item.icon as any || "school"} size={22} color={item.iconColor || Colors.secondary} />
      </View>
      <View style={styles.lessonInfo}>
        <View style={styles.lessonTitleRow}>
          <Text style={styles.lessonTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.lessonFlag}>{item.languageFlag}</Text>
        </View>
        <Text style={styles.lessonSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(item.progress || 0) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round((item.progress || 0) * 100)}%</Text>
        </View>
        <Text style={styles.lessonTime}>{item.lastAccessed}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  const renderCardContent = (item: FavoriteItem) => {
    switch (item.type) {
      case "contact": return renderContactCard(item);
      case "song": return renderSongCard(item);
      case "lesson": return renderLessonCard(item);
    }
  };

  const renderItem = (item: FavoriteItem) => (
    <View key={item.id} style={[styles.swipeContainer, removingId === item.id && { opacity: 0.3, transform: [{ translateX: -300 }] }]}>
      {/* Delete background */}
      <View style={styles.swipeDeleteBg}>
        <Ionicons name="trash" size={20} color="#FFFFFF" />
        <Text style={styles.swipeDeleteText}>Remove</Text>
      </View>
      {/* Card content */}
      <View style={styles.swipeContent}>
        {renderCardContent(item)}
      </View>
      {/* Remove button overlay */}
      <TouchableOpacity
        style={styles.swipeRemoveBtn}
        onPress={() => handleRemoveFavorite(item.id)}
      >
        <Ionicons name="heart-dislike" size={14} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.headerRight}>
          <Ionicons name="heart" size={20} color={Colors.accent} />
          <Text style={styles.headerCount}>{favorites.length}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterTab, activeFilter === filter.key && styles.filterTabActive]}
            onPress={() => {
              setActiveFilter(filter.key);
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Ionicons
              name={filter.icon as any}
              size={14}
              color={activeFilter === filter.key ? Colors.secondary : Colors.textMuted}
            />
            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
            <View style={[styles.filterBadge, activeFilter === filter.key && styles.filterBadgeActive]}>
              <Text style={[styles.filterBadgeText, activeFilter === filter.key && styles.filterBadgeTextActive]}>
                {filter.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items List */}
      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyDesc}>
              Tap the heart icon on contacts, songs, or lessons to save them here.
            </Text>
          </View>
        ) : (
          <>
            {/* Section headers when showing all */}
            {activeFilter === "all" && (
              <>
                {favorites.filter(f => f.type === "contact").length > 0 && (
                  <>
                    <Text style={styles.sectionHeader}>Contacts</Text>
                    {favorites.filter(f => f.type === "contact").map(renderItem)}
                  </>
                )}
                {favorites.filter(f => f.type === "song").length > 0 && (
                  <>
                    <Text style={styles.sectionHeader}>Songs</Text>
                    {favorites.filter(f => f.type === "song").map(renderItem)}
                  </>
                )}
                {favorites.filter(f => f.type === "lesson").length > 0 && (
                  <>
                    <Text style={styles.sectionHeader}>Lessons</Text>
                    {favorites.filter(f => f.type === "lesson").map(renderItem)}
                  </>
                )}
              </>
            )}
            {activeFilter !== "all" && filteredItems.map(renderItem)}
          </>
        )}
        {/* ─── RECENTLY DELETED SECTION ─── */}
        {recentlyDeleted.length > 0 && (
          <View style={styles.deletedSection}>
            <TouchableOpacity
              style={styles.deletedHeader}
              onPress={() => setShowDeleted(!showDeleted)}
            >
              <View style={styles.deletedHeaderLeft}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
                <Text style={styles.deletedTitle}>Recently Deleted</Text>
                <View style={styles.deletedBadge}>
                  <Text style={styles.deletedBadgeText}>{recentlyDeleted.length}</Text>
                </View>
              </View>
              <Ionicons
                name={showDeleted ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
            <Text style={styles.deletedSubtitle}>Items are permanently removed after 30 days</Text>

            {showDeleted && (
              <View style={styles.deletedList}>
                {recentlyDeleted.map((item) => {
                  const daysAgo = Math.floor((Date.now() - item.deletedAt) / (1000 * 60 * 60 * 24));
                  const daysLeft = 30 - daysAgo;
                  return (
                    <View key={item.id} style={styles.deletedItem}>
                      <View style={styles.deletedItemIcon}>
                        <Ionicons
                          name={item.type === "contact" ? "person" : item.type === "song" ? "musical-notes" : "school"}
                          size={16}
                          color={Colors.textMuted}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deletedItemTitle}>{item.title}</Text>
                        <Text style={styles.deletedItemMeta}>
                          {daysAgo === 0 ? "Today" : `${daysAgo}d ago`} • {daysLeft}d left
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.restoreBtn}
                        onPress={() => handleRestore(item.id)}
                      >
                        <Ionicons name="refresh" size={14} color={Colors.success} />
                        <Text style={styles.restoreBtnText}>Restore</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.permDeleteBtn}
                        onPress={() => handlePermanentDelete(item.id)}
                      >
                        <Ionicons name="close" size={14} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── UNDO TOAST ─── */}
      {undoItem && (
        <Animated.View style={[styles.undoToast, { transform: [{ translateY: undoToastAnim }] }]}>
          <Ionicons name="arrow-undo" size={18} color={Colors.secondary} />
          <Text style={styles.undoToastText} numberOfLines={1}>
            Removed "{undoItem.title}"
          </Text>
          <TouchableOpacity style={styles.undoBtn} onPress={handleUndo}>
            <Text style={styles.undoBtnText}>UNDO</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerCount: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.accent,
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: 6,
    marginBottom: Spacing.md,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.glowSubtle,
    borderColor: Colors.secondary,
  },
  filterText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: Colors.secondary,
  },
  filterBadge: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterBadgeActive: {
    backgroundColor: Colors.secondary + "30",
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  filterBadgeTextActive: {
    color: Colors.secondary,
  },

  // List
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg },

  // Section headers
  sectionHeader: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Contact cards
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  contactAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.glowBorder,
  },
  contactAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.secondary,
  },
  contactOnline: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surfaceCard,
  },
  contactInfo: { flex: 1, gap: 2 },
  contactNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactName: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  contactFlag: { fontSize: 14 },
  contactSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  contactTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  contactActions: {
    flexDirection: "row",
    gap: 8,
  },
  contactActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Song cards
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  songIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: { flex: 1, gap: 2 },
  songTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  songTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  songFlag: { fontSize: 14 },
  songArtist: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  songTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  songPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },

  // Lesson cards
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  lessonIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonInfo: { flex: 1, gap: 3 },
  lessonTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lessonTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  lessonFlag: { fontSize: 14 },
  lessonSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.success,
    width: 30,
  },
  lessonTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },

  // Swipe-to-remove
  swipeContainer: {
    position: "relative",
    marginBottom: 0,
  },
  swipeDeleteBg: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 8,
    width: 80,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  swipeDeleteText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  swipeContent: {
    backgroundColor: Colors.primary,
  },
  swipeRemoveBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.error + "20",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.error + "40",
  },

  // Undo Toast
  undoToast: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  undoToastText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  undoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.secondary + "20",
    borderRadius: BorderRadius.full,
  },
  undoBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.secondary,
  },

  // Recently Deleted Section
  deletedSection: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error + "20",
  },
  deletedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deletedHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deletedTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.error,
  },
  deletedBadge: {
    backgroundColor: Colors.error + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  deletedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.error,
  },
  deletedSubtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  deletedList: {
    marginTop: Spacing.md,
    gap: 8,
  },
  deletedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  deletedItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  deletedItemTitle: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  deletedItemMeta: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.success + "15",
    borderRadius: BorderRadius.full,
  },
  restoreBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.success,
  },
  permDeleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error + "15",
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl * 2,
    gap: 12,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
    lineHeight: 20,
  },
});
