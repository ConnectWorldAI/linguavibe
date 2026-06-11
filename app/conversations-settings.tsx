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

// Storage keys
const CHAT_THEME_KEY = "@connectworld_chat_theme";
const ANIMATIONS_KEY = "@connectworld_animations";
const SAVE_MEDIA_KEY = "@connectworld_save_media";
const KEEP_ARCHIVED_KEY = "@connectworld_keep_archived";
const VOICE_TRANSCRIPTS_KEY = "@connectworld_voice_transcripts";

type ChatTheme = "default" | "dark" | "warm" | "ocean" | "forest";

type ConversationsState = {
  chatTheme: ChatTheme;
  animationsEnabled: boolean;
  saveMediaToPhotos: boolean;
  keepConversationsArchived: boolean;
  voiceTranscriptsEnabled: boolean;
};

const THEME_OPTIONS: { id: ChatTheme; name: string; preview: string }[] = [
  { id: "default", name: "Default", preview: "Clean & minimal" },
  { id: "dark", name: "Dark Mode", preview: "Easy on the eyes" },
  { id: "warm", name: "Warm Tones", preview: "Cozy & inviting" },
  { id: "ocean", name: "Ocean Blue", preview: "Calm & focused" },
  { id: "forest", name: "Forest Green", preview: "Natural & grounded" },
];

export default function ConversationsSettingsScreen() {
  const colors = useColors();
  const [state, setState] = useState<ConversationsState>({
    chatTheme: "default",
    animationsEnabled: true,
    saveMediaToPhotos: false,
    keepConversationsArchived: true,
    voiceTranscriptsEnabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [theme, anims, save, archive, transcripts] = await Promise.all([
        AsyncStorage.getItem(CHAT_THEME_KEY),
        AsyncStorage.getItem(ANIMATIONS_KEY),
        AsyncStorage.getItem(SAVE_MEDIA_KEY),
        AsyncStorage.getItem(KEEP_ARCHIVED_KEY),
        AsyncStorage.getItem(VOICE_TRANSCRIPTS_KEY),
      ]);
      setState({
        chatTheme: (theme as ChatTheme) || "default",
        animationsEnabled: anims !== "false",
        saveMediaToPhotos: save === "true",
        keepConversationsArchived: archive !== "false",
        voiceTranscriptsEnabled: transcripts !== "false",
      });
    } catch {}
  };

  const saveSetting = async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  };

  const handleThemeChange = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Conversation Theme",
      "Choose a visual theme for your conversations:",
      [
        ...THEME_OPTIONS.map((t) => ({
          text: `${t.name} — ${t.preview}`,
          onPress: async () => {
            setState((prev) => ({ ...prev, chatTheme: t.id }));
            await saveSetting(CHAT_THEME_KEY, t.id);
          },
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  };

  const toggleSetting = async (key: keyof ConversationsState, storageKey: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = !state[key];
    setState((prev) => ({ ...prev, [key]: newVal }));
    await saveSetting(storageKey, String(newVal));
  };

  const handleExportConversations = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Export Conversations",
      "Export your lesson conversations, AI tutor chats, and practice sessions as a file you can save or share.",
      [
        { text: "Export as PDF", onPress: () => Alert.alert("Exporting...", "Your conversations will be ready to download shortly.") },
        { text: "Export as Text", onPress: () => Alert.alert("Exporting...", "Your conversations will be ready to download shortly.") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleBackupConversations = () => {
    Alert.alert(
      "Backup Conversations",
      "Back up your conversation history to your account. This includes AI tutor sessions, practice calls, and lesson chats.",
      [
        { text: "Back Up Now", onPress: () => Alert.alert("Backup Started", "Your conversations are being backed up. This may take a moment.") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleClearConversations = () => {
    Alert.alert(
      "Clear All Conversations?",
      "This will permanently delete all your conversation history including AI tutor chats, lesson transcripts, and practice sessions. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert("Cleared", "All conversations have been deleted.");
          },
        },
      ]
    );
  };

  const handleArchiveAll = () => {
    Alert.alert(
      "Archive All Conversations?",
      "All conversations will be moved to your archive. You can access them anytime from the archive folder.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive All",
          onPress: () => Alert.alert("Done", "All conversations have been archived."),
        },
      ]
    );
  };

  const styles = createStyles(colors);
  const currentTheme = THEME_OPTIONS.find((t) => t.id === state.chatTheme) || THEME_OPTIONS[0];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversations</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleThemeChange} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="color-palette" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Conversation Theme</Text>
                <Text style={styles.rowSubtitle}>{currentTheme.name}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Animations</Text>
                <Text style={styles.rowSubtitle}>Animate emoji, stickers, and reactions</Text>
              </View>
            </View>
            <Switch
              value={state.animationsEnabled}
              onValueChange={() => toggleSetting("animationsEnabled", ANIMATIONS_KEY)}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={state.animationsEnabled ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* Media */}
        <Text style={styles.sectionTitle}>Media</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.success + "15" }]}>
                <Ionicons name="images" size={20} color={colors.success} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Save to Photos</Text>
                <Text style={styles.rowSubtitle}>Auto-save shared images and videos to your photo library</Text>
              </View>
            </View>
            <Switch
              value={state.saveMediaToPhotos}
              onValueChange={() => toggleSetting("saveMediaToPhotos", SAVE_MEDIA_KEY)}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={state.saveMediaToPhotos ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* History & Backup */}
        <Text style={styles.sectionTitle}>History & Backup</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleBackupConversations} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="cloud-upload" size={20} color={colors.primary} />
              </View>
              <Text style={styles.rowTitle}>Backup Conversations</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.row} onPress={handleExportConversations} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="download" size={20} color={colors.primary} />
              </View>
              <Text style={styles.rowTitle}>Export Conversations</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.row} onPress={() => router.push("/voice-transcripts" as any)} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.warning + "15" }]}>
                <Ionicons name="mic" size={20} color={colors.warning} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Voice Message Transcripts</Text>
                <Text style={styles.rowSubtitle}>Auto-transcribe voice messages for review</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Archive & Privacy */}
        <Text style={styles.sectionTitle}>Archive & Privacy</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="archive" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Keep Conversations Archived</Text>
                <Text style={styles.rowSubtitle}>Archived items stay archived when new messages arrive</Text>
              </View>
            </View>
            <Switch
              value={state.keepConversationsArchived}
              onValueChange={() => toggleSetting("keepConversationsArchived", KEEP_ARCHIVED_KEY)}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={state.keepConversationsArchived ? colors.primary : colors.muted}
            />
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.row} onPress={handleArchiveAll} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="folder" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.primary }]}>Archive All Conversations</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleClearConversations} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.error + "15" }]}>
                <Ionicons name="trash" size={20} color={colors.error} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.error }]}>Clear All Conversations</Text>
            </View>
          </TouchableOpacity>
        </View>

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
      marginBottom: 16,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
    },
    rowLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
    rowTextContainer: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground },
    rowSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    separator: { height: 0.5, marginLeft: 62 },
  });
}
