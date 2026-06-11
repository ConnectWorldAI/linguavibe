import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { getFavorites, removeFavorite, type FavoriteItem } from "@/lib/favorites-storage";
import { Colors } from "@/constants/Colors";

interface FavoritesSectionProps {
  refreshTrigger?: number;
}

export function FavoritesSection({ refreshTrigger }: FavoritesSectionProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    loadFavorites();
  }, [refreshTrigger]);

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs);
  };

  const handlePress = (item: FavoriteItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(item.route as any);
  };

  const handleRemove = async (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const updated = await removeFavorite(id);
    setFavorites(updated);
  };

  if (favorites.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="star" size={16} color={Colors.accent} />
        <Text style={styles.title}>Pinned Favorites</Text>
        <Text style={styles.count}>{favorites.length}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {favorites.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.favItem}
            onPress={() => handlePress(item)}
            onLongPress={() => handleRemove(item.id)}
          >
            <View style={styles.favIconCircle}>
              <Text style={styles.favIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.favLabel} numberOfLines={1}>
              {item.title}
            </Text>
            <TouchableOpacity
              style={styles.unpinBtn}
              onPress={() => handleRemove(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={14} color={Colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  count: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  scrollContent: {
    gap: 10,
    paddingRight: 16,
  },
  favItem: {
    alignItems: "center",
    width: 72,
    position: "relative",
  },
  favIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.accent + "30",
  },
  favIcon: {
    fontSize: 22,
  },
  favLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  unpinBtn: {
    position: "absolute",
    top: -2,
    right: 6,
  },
});
