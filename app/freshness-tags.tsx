import { useState, useMemo } from "react";
import { Text, View, FlatList, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  getFreshnessTags,
  getFreshnessBadge,
  type FreshnessTag,
  type FreshnessLevel,
} from "@/lib/freshness-tags";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";

const FRESHNESS_FILTERS: { level: FreshnessLevel | "all"; label: string; emoji: string }[] = [
  { level: "all", label: "All", emoji: "🗂️" },
  { level: "trending", label: "Trending", emoji: "🔥" },
  { level: "current", label: "Current", emoji: "✅" },
  { level: "classic", label: "Classic", emoji: "📚" },
  { level: "outdated", label: "Outdated", emoji: "⚠️" },
  { level: "textbook", label: "Textbook", emoji: "📖" },
];

export default function FreshnessTagsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [languageCode, setLanguageCode] = useState<string>("es-DO");
  const [activeFilter, setActiveFilter] = useState<FreshnessLevel | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load user's active language
  useEffect(() => {
    AsyncStorage.getItem("active_language").then((lang) => {
      if (lang) setLanguageCode(lang);
    });
  }, []);

  const allTags = useMemo(() => getFreshnessTags(languageCode), [languageCode]);
  const filteredTags = useMemo(() => {
    if (activeFilter === "all") return allTags;
    return allTags.filter((t) => t.freshness === activeFilter);
  }, [allTags, activeFilter]);

  const renderTag = ({ item }: { item: FreshnessTag }) => {
    const badge = getFreshnessBadge(item.freshness);
    const isExpanded = expandedId === item.word;

    return (
      <Pressable
        onPress={() => setExpandedId(isExpanded ? null : item.word)}
        style={({ pressed }) => [
          {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
                {item.word}
              </Text>
              <View
                style={{
                  backgroundColor: badge.color + "20",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 12 }}>{badge.emoji}</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: badge.color }}>
                  {badge.label}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
              {item.translation}
            </Text>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={{ marginTop: 12, gap: 8 }}>
            {item.note && (
              <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 12 }}>
                <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 18 }}>
                  💡 {item.note}
                </Text>
              </View>
            )}
            {item.alternative && (
              <View style={{ backgroundColor: "#22C55E15", borderRadius: 8, padding: 12 }}>
                <Text style={{ fontSize: 13, color: colors.foreground }}>
                  ✅ People actually say: <Text style={{ fontWeight: "700" }}>{item.alternative}</Text>
                </Text>
              </View>
            )}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {item.ageGroup && (
                <View style={{ backgroundColor: colors.background, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, color: colors.muted }}>👤 {item.ageGroup}</Text>
                </View>
              )}
              {item.region && (
                <View style={{ backgroundColor: colors.background, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, color: colors.muted }}>📍 {item.region}</Text>
                </View>
              )}
              {item.yearPopularized && (
                <View style={{ backgroundColor: colors.background, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, color: colors.muted }}>📅 Since {item.yearPopularized}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 4 }]}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.primary} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>
            Freshness Tags
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            What people ACTUALLY say vs. textbook
          </Text>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
      >
        {FRESHNESS_FILTERS.map((filter) => {
          const isActive = activeFilter === filter.level;
          return (
            <Pressable
              key={filter.level}
              onPress={() => setActiveFilter(filter.level)}
              style={({ pressed }) => [
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderWidth: 1,
                  borderColor: isActive ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 14 }}>{filter.emoji}</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: isActive ? "#fff" : colors.foreground,
                }}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Stats */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 12, color: colors.muted }}>
          {filteredTags.length} word{filteredTags.length !== 1 ? "s" : ""} • Tap to expand
        </Text>
      </View>

      {/* Tags List */}
      <FlatList
        data={filteredTags}
        renderItem={renderTag}
        keyExtractor={(item) => item.word}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Text style={{ fontSize: 40 }}>📖</Text>
            <Text style={{ fontSize: 16, color: colors.muted, marginTop: 8, textAlign: "center" }}>
              No vocabulary with this tag yet.{"\n"}Try a different filter!
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
