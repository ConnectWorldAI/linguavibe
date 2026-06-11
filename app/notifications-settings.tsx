import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const NOTIF_STORAGE_KEY = "@connectworld_notification_settings";

type NotificationState = {
  // Lesson notifications
  lessonShow: boolean;
  lessonSound: string;
  lessonReactions: boolean;
  // Group/Community notifications
  groupShow: boolean;
  groupSound: string;
  groupReactions: boolean;
  // Progress notifications
  progressShow: boolean;
  progressSound: string;
  progressReactions: boolean;
  // Channels
  recommendedChannels: boolean;
  // General
  reminders: boolean;
  showPreview: boolean;
  // Home screen
  appIconBadge: boolean;
  inAppBanners: boolean;
  inAppSounds: boolean;
  inAppVibrate: boolean;
};

const DEFAULT_STATE: NotificationState = {
  lessonShow: true,
  lessonSound: "Note",
  lessonReactions: true,
  groupShow: true,
  groupSound: "Note",
  groupReactions: true,
  progressShow: true,
  progressSound: "Note",
  progressReactions: true,
  recommendedChannels: true,
  reminders: true,
  showPreview: true,
  appIconBadge: true,
  inAppBanners: true,
  inAppSounds: true,
  inAppVibrate: true,
};

export default function NotificationsSettingsScreen() {
  const colors = useColors();
  const [state, setState] = useState<NotificationState>(DEFAULT_STATE);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIF_STORAGE_KEY);
      if (stored) setState({ ...DEFAULT_STATE, ...JSON.parse(stored) });
    } catch {}
  };

  const saveSettings = async (newState: NotificationState) => {
    setState(newState);
    await AsyncStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(newState));
  };

  const toggle = (key: keyof NotificationState) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = { ...state, [key]: !state[key] };
    saveSettings(newState);
  };

  const handleSoundPicker = (category: string) => {
    Alert.alert(
      `${category} Sound`,
      "Choose a notification sound:",
      [
        { text: "Note", onPress: () => {} },
        { text: "Chime", onPress: () => {} },
        { text: "Bell", onPress: () => {} },
        { text: "Ping", onPress: () => {} },
        { text: "Silent", onPress: () => {} },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleResetNotifications = () => {
    Alert.alert(
      "Reset Notification Settings?",
      "This will reset all notification settings to their defaults, including custom sounds and preferences for individual conversations.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await saveSettings(DEFAULT_STATE);
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const s = createStyles(colors);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Lesson Notifications */}
        <Text style={s.sectionTitle}>Lesson Notifications</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowTitle}>Show notifications</Text>
            <Switch
              value={state.lessonShow}
              onValueChange={() => toggle("lessonShow")}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={state.lessonShow ? colors.primary : colors.muted}
            />
          </View>
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={s.row} onPress={() => handleSoundPicker("Lesson")} activeOpacity={0.7}>
            <Text style={s.rowTitle}>Sound</Text>
            <View style={s.rowRight}>
              <Text style={s.rowValue}>{state.lessonSound}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
          </TouchableOpacity>
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <View style={s.row}>
            <Text style={s.rowTitle}>Reaction notifications</Text>
            <Switch
              value={state.lessonReactions}
              onValueChange={() => toggle("lessonReactions")}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={state.lessonReactions ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* Group Notifications */}
        <Text style={s.sectionTitle}>Group Notifications</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowTitle}>Show notifications</Text>
            <Switch
              value={state.groupShow}
              onValueChange={() => toggle("groupShow")}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={state.groupShow ? colors.primary : colors.muted}
            />
          </View>
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={s.row} onPress={() => handleSoundPicker("Group")} activeOpacity={0.7}>
            <Text style={s.rowTitle}>Sound</Text>
            <View style={s.rowRight}>
              <Text style={s.rowValue}>{state.groupSound}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
          </TouchableOpacity>
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <View style={s.row}>
            <Text style={s.rowTitle}>Reaction notifications</Text>
            <Switch
              value={state.groupReactions}
              onValueChange={() => toggle("groupReactions")}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={state.groupReactions ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* Progress Notifications */}
        <Text style={s.sectionTitle}>Progress Notifications</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowTitle}>Show notifications</Text>
            <Switch
              value={state.progressShow}
              onValueChange={() => toggle("progressShow")}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={state.progressShow ? colors.primary : colors.muted}
            />
          </View>
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={s.row} onPress={() => handleSoundPicker("Progress")} activeOpacity={0.7}>
            <Text style={s.rowTitle}>Sound</Text>
            <View style={s.rowRight}>
              <Text style={s.rowValue}>{state.progressSound}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
          </TouchableOpacity>
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <View style={s.row}>
            <Text style={s.rowTitle}>Reaction notifications</Text>
            <Switch
              value={state.progressReactions}
              onValueChange={() => toggle("progressReactions")}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={state.progressReactions ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* Channels */}
        <Text style={s.sectionTitle}>Channels</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Recommended channels</Text>
              <Text style={s.rowSubtitle}>Find out about channels that may interest you.</Text>
            </View>
            <Switch
              value={state.recommendedChannels}
              onValueChange={() => toggle("recommendedChannels")}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={state.recommendedChannels ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* Reminders */}
        <View style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Reminders</Text>
              <Text style={s.rowSubtitle}>Get occasional reminders about lessons, practice sessions, or streaks you haven't completed.</Text>
            </View>
            <Switch
              value={state.reminders}
              onValueChange={() => toggle("reminders")}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={state.reminders ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* Home Screen */}
        <Text style={s.sectionTitle}>Home Screen Notifications</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>App icon badge</Text>
              <Text style={s.rowSubtitle}>Clears when you view all messages and lessons</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <TouchableOpacity style={s.row} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>In-app notifications</Text>
              <Text style={s.rowSubtitle}>Banners, Sounds, Vibrate</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Show Preview */}
        <View style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Show preview</Text>
              <Text style={s.rowSubtitle}>Preview message text inside new notifications.</Text>
            </View>
            <Switch
              value={state.showPreview}
              onValueChange={() => toggle("showPreview")}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={state.showPreview ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* Reset */}
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={handleResetNotifications} activeOpacity={0.7}>
            <Text style={[s.rowTitle, { color: colors.error }]}>Reset notification settings</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.footerNote}>
          Reset all notification settings, including custom notification settings for your conversations.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    content: { paddingHorizontal: 16, paddingBottom: 40 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 8,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 12,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
    },
    rowTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground },
    rowSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2, paddingRight: 40 },
    rowRight: { flexDirection: "row", alignItems: "center", gap: 4 },
    rowValue: { fontSize: 14, color: colors.muted },
    sep: { height: 0.5, marginLeft: 14 },
    footerNote: { fontSize: 12, color: colors.muted, paddingHorizontal: 4, marginTop: -4, marginBottom: 16 },
  });
}
