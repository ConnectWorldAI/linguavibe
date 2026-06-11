/**
 * RecentlyVisitedRow — horizontal scroll row showing pinned + recently visited features.
 * Rendered below the search bar on the home screen.
 * Long-press a chip to pin/unpin it.
 */
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "@/constants/Colors";
import {
  RecentlyVisitedItem,
  getMergedRecentAndPinned,
  pinFeature,
  unpinFeature,
} from "@/lib/recently-visited";
import { trackFeatureUsed } from "@/lib/analytics";

interface Props {
  refreshTrigger?: number;
}

export function RecentlyVisitedRow({ refreshTrigger = 0 }: Props) {
  const [items, setItems] = useState<RecentlyVisitedItem[]>([]);

  const loadItems = useCallback(async () => {
    const merged = await getMergedRecentAndPinned();
    setItems(merged);
  }, [refreshTrigger]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const handleLongPress = (item: RecentlyVisitedItem) => {
    if (item.pinned) {
      // Unpin
      if (Platform.OS === "web") {
        unpinFeature(item.id).then(loadItems);
      } else {
        Alert.alert(
          "Unpin Feature",
          `Remove "${item.title}" from pinned?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Unpin",
              style: "destructive",
              onPress: () => unpinFeature(item.id).then(loadItems),
            },
          ]
        );
      }
    } else {
      // Pin
      if (Platform.OS === "web") {
        pinFeature({ id: item.id, title: item.title, icon: item.icon, route: item.route, color: item.color }).then(loadItems);
      } else {
        Alert.alert(
          "Pin Feature",
          `Keep "${item.title}" always visible?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Pin",
              onPress: () =>
                pinFeature({ id: item.id, title: item.title, icon: item.icon, route: item.route, color: item.color }).then(loadItems),
            },
          ]
        );
      }
    }
  };

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.headerText}>Recently Visited</Text>
        <Text style={styles.hintText}>Hold to pin</Text>
        <TouchableOpacity
          onPress={() => router.push("/manage-pins" as any)}
          style={styles.manageLink}
          activeOpacity={0.6}
        >
          <Text style={styles.manageLinkText}>Manage</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.chip, item.pinned && styles.chipPinned]}
            activeOpacity={0.7}
            onPress={() => {
              trackFeatureUsed(item.id);
              router.push(item.route as any);
            }}
            onLongPress={() => handleLongPress(item)}
            delayLongPress={400}
          >
            {item.pinned && (
              <View style={styles.pinBadge}>
                <Ionicons name="pin" size={10} color={Colors.accent} />
              </View>
            )}
            <View style={[styles.chipIcon, { backgroundColor: (item.color || Colors.primary) + "15" }]}>
              <Ionicons name={item.icon as any} size={16} color={item.color || Colors.primary} />
            </View>
            <Text style={styles.chipLabel} numberOfLines={1}>
              {item.title}
            </Text>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: 10,
    color: Colors.textMuted + "80",
    flex: 1,
    textAlign: "right",
    fontStyle: "italic",
  },
  manageLink: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  manageLinkText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.accent,
  },
  scrollContent: {
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  chipPinned: {
    borderColor: Colors.accent + "50",
    backgroundColor: Colors.accent + "08",
  },
  chipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
    maxWidth: 100,
  },
  pinBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent + "20",
    alignItems: "center",
    justifyContent: "center",
  },
});
