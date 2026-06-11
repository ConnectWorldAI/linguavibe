import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { BrandName } from "@/components/brand-name";

const { width } = Dimensions.get("window");
const PADDING = 24;
const GAP = 14;
const COLUMNS = 2;
const ITEM_SIZE = (width - PADDING * 2 - GAP) / COLUMNS;

interface ExploreOption {
  id: string;
  icon: string;
  label: string;
  route: string;
  params?: Record<string, string>;
  iconColor: string;
  bgColor: string;
}

const EXPLORE_OPTIONS: ExploreOption[] = [
  {
    id: "explore",
    icon: "compass",
    label: "Explore",
    route: "/(tabs)",
    iconColor: "#60A5FA",
    bgColor: "rgba(96, 165, 250, 0.12)",
  },
  {
    id: "music",
    icon: "headset",
    label: "Listen To Music",
    route: "/playlists",
    iconColor: "#F472B6",
    bgColor: "rgba(244, 114, 182, 0.12)",
  },
  {
    id: "course",
    icon: "book",
    label: "Take A Course",
    route: "/course-catalog",
    iconColor: "#FBBF24",
    bgColor: "rgba(251, 191, 36, 0.12)",
  },
  {
    id: "translate",
    icon: "language",
    label: "Translate",
    route: "/(tabs)/translate",
    iconColor: "#34D399",
    bgColor: "rgba(52, 211, 153, 0.12)",
  },
  {
    id: "call",
    icon: "call",
    label: "Make A Call",
    route: "/(tabs)/calls",
    iconColor: "#4ADE80",
    bgColor: "rgba(74, 222, 128, 0.12)",
  },
  {
    id: "message",
    icon: "chatbubbles",
    label: "Send A Text",
    route: "/(tabs)/messages",
    iconColor: "#60A5FA",
    bgColor: "rgba(96, 165, 250, 0.12)",
  },
  {
    id: "video-call",
    icon: "videocam",
    label: "Video Call",
    route: "/(tabs)/calls",
    params: { tab: "video" },
    iconColor: "#F87171",
    bgColor: "rgba(248, 113, 113, 0.12)",
  },
  {
    id: "entertainment",
    icon: "tv",
    label: "Entertainment",
    route: "/(tabs)/tv",
    iconColor: "#C084FC",
    bgColor: "rgba(192, 132, 252, 0.12)",
  },
];

export default function ExploreAppScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = async (option: ExploreOption) => {
    setSelectedId(option.id);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await AsyncStorage.setItem("@explore_choice_made", "true");

    setTimeout(() => {
      if (option.params) {
        router.replace({ pathname: option.route as any, params: option.params });
      } else {
        router.replace(option.route as any);
      }
    }, 220);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <BrandName size="sm" showTagline={false} />
          <Text style={styles.title}>What would you like to do?</Text>
        </View>

        {/* 2×4 Grid */}
        <View style={styles.grid}>
          {EXPLORE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.gridItem,
                selectedId === option.id && styles.gridItemSelected,
              ]}
              onPress={() => handleSelect(option)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconWrap, { backgroundColor: option.bgColor }]}>
                <Ionicons name={option.icon as any} size={24} color={option.iconColor} />
              </View>
              <Text style={styles.label}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060912",
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 14,
    textAlign: "center",
    opacity: 0.92,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: GAP,
    rowGap: GAP,
  },
  gridItem: {
    width: ITEM_SIZE,
    alignItems: "center",
    paddingVertical: 22,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  gridItemSelected: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: "rgba(255,255,255,0.18)",
    transform: [{ scale: 0.97 }],
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
  },
});
