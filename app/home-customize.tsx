import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Switch, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
  secondary: "#00AAFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  gold: "#FFD700",
  success: "#00E676",
  error: "#FF5252",
};

const STORAGE_KEY = "@connectworld_home_layout";

interface CardConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  visible: boolean;
}

const DEFAULT_CARDS: CardConfig[] = [
  { id: "streak", label: "Streak Counter", icon: "flame", color: "#FF6B35", visible: true },
  { id: "usage", label: "Usage & Balance", icon: "speedometer", color: Colors.secondary, visible: true },
  { id: "progress", label: "My Progress", icon: "analytics", color: "#8B5CF6", visible: true },
  { id: "daily-goals", label: "Daily Goals", icon: "flag", color: Colors.success, visible: true },
  { id: "weekly-digest", label: "Weekly Digest", icon: "newspaper", color: Colors.gold, visible: true },
  { id: "milestones", label: "Milestones", icon: "trophy", color: Colors.gold, visible: true },
  { id: "daily-challenge", label: "Daily Challenge", icon: "flash", color: "#FF9F43", visible: true },
  { id: "featured", label: "Featured Content", icon: "star", color: "#A855F7", visible: true },
  { id: "continue-learning", label: "Continue Learning", icon: "play-circle", color: Colors.secondary, visible: true },
  { id: "upcoming-classes", label: "Upcoming Classes", icon: "calendar", color: "#00BCD4", visible: true },
  { id: "ai-tip", label: "AI Learning Tip", icon: "bulb", color: Colors.gold, visible: true },
];

export default function HomeCustomizeScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<CardConfig[]>(DEFAULT_CARDS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadLayout();
  }, []);

  const loadLayout = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults in case new cards were added
        const merged = DEFAULT_CARDS.map((def) => {
          const saved = parsed.find((s: CardConfig) => s.id === def.id);
          return saved ? { ...def, visible: saved.visible, } : def;
        });
        // Reorder based on saved order
        const orderedIds = parsed.map((p: CardConfig) => p.id);
        merged.sort((a, b) => {
          const aIdx = orderedIds.indexOf(a.id);
          const bIdx = orderedIds.indexOf(b.id);
          if (aIdx === -1) return 1;
          if (bIdx === -1) return -1;
          return aIdx - bIdx;
        });
        setCards(merged);
      }
    } catch {}
  };

  const saveLayout = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasChanges(false);
    } catch {}
  };

  const toggleCard = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );
    setHasChanges(true);
  };

  const moveCard = (index: number, direction: "up" | "down") => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newCards = [...cards];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCards.length) return;
    [newCards[index], newCards[targetIndex]] = [newCards[targetIndex], newCards[index]];
    setCards(newCards);
    setHasChanges(true);
  };

  const resetToDefault = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCards(DEFAULT_CARDS);
    setHasChanges(true);
  };

  const visibleCount = cards.filter((c) => c.visible).length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customize Home</Text>
        <TouchableOpacity
          onPress={saveLayout}
          style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
          disabled={!hasChanges}
        >
          <Text style={[styles.saveBtnText, !hasChanges && styles.saveBtnTextDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={Colors.secondary} />
          <Text style={styles.infoText}>
            Toggle cards on/off and reorder them using the arrows. Changes apply to your home screen.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{visibleCount}</Text>
            <Text style={styles.statLabel}>Visible</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{cards.length - visibleCount}</Text>
            <Text style={styles.statLabel}>Hidden</Text>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={resetToDefault}>
            <Ionicons name="refresh" size={16} color={Colors.error} />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Card List */}
        {cards.map((card, index) => (
          <View key={card.id} style={[styles.cardRow, !card.visible && styles.cardRowHidden]}>
            <View style={styles.cardLeft}>
              <View style={[styles.cardIcon, { backgroundColor: card.color + "20" }]}>
                <Ionicons name={card.icon as any} size={18} color={card.color} />
              </View>
              <View>
                <Text style={[styles.cardLabel, !card.visible && styles.cardLabelHidden]}>
                  {card.label}
                </Text>
                <Text style={styles.cardPosition}>Position {index + 1}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <View style={styles.arrowBtns}>
                <TouchableOpacity
                  onPress={() => moveCard(index, "up")}
                  style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
                  disabled={index === 0}
                >
                  <Ionicons name="chevron-up" size={16} color={index === 0 ? Colors.textMuted : Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveCard(index, "down")}
                  style={[styles.arrowBtn, index === cards.length - 1 && styles.arrowBtnDisabled]}
                  disabled={index === cards.length - 1}
                >
                  <Ionicons name="chevron-down" size={16} color={index === cards.length - 1 ? Colors.textMuted : Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Switch
                value={card.visible}
                onValueChange={() => toggleCard(card.id)}
                trackColor={{ false: "#333", true: Colors.secondary + "60" }}
                thumbColor={card.visible ? Colors.secondary : "#666"}
              />
            </View>
          </View>
        ))}

        {/* Bottom Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
  saveBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveBtnDisabled: { backgroundColor: Colors.surface },
  saveBtnText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  saveBtnTextDisabled: { color: Colors.textMuted },
  content: { padding: 16 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.secondary + "10",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.secondary + "20",
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  statBadge: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.error + "15",
  },
  resetText: { fontSize: 13, fontWeight: "600", color: Colors.error },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardRowHidden: { opacity: 0.5 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  cardLabelHidden: { color: Colors.textMuted, textDecorationLine: "line-through" },
  cardPosition: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  arrowBtns: { gap: 2 },
  arrowBtn: {
    width: 26,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  arrowBtnDisabled: { opacity: 0.3 },
});
