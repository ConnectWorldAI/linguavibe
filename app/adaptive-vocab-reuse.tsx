import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

// Types
interface VocabWord {
  id: string;
  word: string;
  translation: string;
  struggleScore: number; // 0-100
  masteryProgress: number; // 0-100
  nextAppearance: string; // ISO date string
  contexts: string[];
}

interface WeavingSettings {
  conversations: boolean;
  flashcards: boolean;
  stories: boolean;
  songs: boolean;
}

// Mock Data
const MOCK_VOCAB: VocabWord[] = [
  {
    id: "1",
    word: "Serendipity",
    translation: "Finding something good without looking for it",
    struggleScore: 85,
    masteryProgress: 15,
    nextAppearance: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours
    contexts: ["conversations", "stories"],
  },
  {
    id: "2",
    word: "Ephemeral",
    translation: "Lasting for a very short time",
    struggleScore: 72,
    masteryProgress: 28,
    nextAppearance: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12 hours
    contexts: ["flashcards"],
  },
  {
    id: "3",
    word: "Ubiquitous",
    translation: "Present, appearing, or found everywhere",
    struggleScore: 90,
    masteryProgress: 10,
    nextAppearance: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 mins
    contexts: ["conversations", "flashcards", "songs"],
  },
  {
    id: "4",
    word: "Mellifluous",
    translation: "Sweet or musical; pleasant to hear",
    struggleScore: 60,
    masteryProgress: 40,
    nextAppearance: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 1 day
    contexts: ["songs", "stories"],
  },
  {
    id: "5",
    word: "Ineffable",
    translation: "Too great or extreme to be expressed in words",
    struggleScore: 78,
    masteryProgress: 22,
    nextAppearance: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(), // 5 hours
    contexts: ["stories"],
  },
];

const DEFAULT_SETTINGS: WeavingSettings = {
  conversations: true,
  flashcards: true,
  stories: true,
  songs: false,
};

export default function AdaptiveVocabReuseScreen() {
  const [vocabList, setVocabList] = useState<VocabWord[]>([]);
  const [settings, setSettings] = useState<WeavingSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<"list" | "cloud" | "settings">("list");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedVocab = await AsyncStorage.getItem("@vocab_list");
        const storedSettings = await AsyncStorage.getItem("@weaving_settings");

        if (storedVocab) {
          setVocabList(JSON.parse(storedVocab));
        } else {
          setVocabList(MOCK_VOCAB);
          await AsyncStorage.setItem("@vocab_list", JSON.stringify(MOCK_VOCAB));
        }

        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save data
  const saveVocab = async (newList: VocabWord[]) => {
    setVocabList(newList);
    try {
      await AsyncStorage.setItem("@vocab_list", JSON.stringify(newList));
    } catch (error) {
      console.error("Failed to save vocab", error);
    }
  };

  const saveSettings = async (newSettings: WeavingSettings) => {
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem("@weaving_settings", JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  };

  // Actions
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const toggleSetting = (key: keyof WeavingSettings) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveSettings({ ...settings, [key]: !settings[key] });
  };

  const handleAddWord = () => {
    if (!newWord.trim() || !newTranslation.trim()) {
      Alert.alert("Error", "Please enter both word and translation.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const newVocabItem: VocabWord = {
      id: Date.now().toString(),
      word: newWord.trim(),
      translation: newTranslation.trim(),
      struggleScore: 100, // New words start with high struggle
      masteryProgress: 0,
      nextAppearance: new Date(Date.now() + 1000 * 60 * 15).toISOString(), // 15 mins
      contexts: ["flashcards"],
    };

    saveVocab([newVocabItem, ...vocabList]);
    setNewWord("");
    setNewTranslation("");
    setIsAddModalVisible(false);
  };

  const handleRemoveWord = (id: string) => {
    Alert.alert(
      "Remove Word",
      "Are you sure you want to remove this word from your adaptive learning list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            saveVocab(vocabList.filter((v) => v.id !== id));
          },
        },
      ]
    );
  };

  const handleExport = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Export Successful",
      "Your vocabulary list has been exported to your documents folder as a CSV file."
    );
  };

  const formatTimeUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Now";
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.error || "#FF3B30";
    if (score >= 50) return Colors.warning || "#FF9500";
    return Colors.success || "#34C759";
  };

  // Renderers
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={28} color={Colors.textPrimary || "#FFFFFF"} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Adaptive Vocab</Text>
        <Text style={styles.headerSubtitle}>SRS Reintroduction</Text>
      </View>
      <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
        <Ionicons name="download-outline" size={24} color={Colors.secondary || "#00AAFF"} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "list" && styles.activeTab]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setActiveTab("list");
        }}
      >
        <Ionicons 
          name="list" 
          size={20} 
          color={activeTab === "list" ? (Colors.glow || "#00CCFF") : (Colors.textMuted || "#3D5A7A")} 
        />
        <Text style={[styles.tabText, activeTab === "list" && styles.activeTabText]}>List</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "cloud" && styles.activeTab]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setActiveTab("cloud");
        }}
      >
        <Ionicons 
          name="cloud-outline" 
          size={20} 
          color={activeTab === "cloud" ? (Colors.glow || "#00CCFF") : (Colors.textMuted || "#3D5A7A")} 
        />
        <Text style={[styles.tabText, activeTab === "cloud" && styles.activeTabText]}>Cloud</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "settings" && styles.activeTab]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setActiveTab("settings");
        }}
      >
        <Ionicons 
          name="settings-outline" 
          size={20} 
          color={activeTab === "settings" ? (Colors.glow || "#00CCFF") : (Colors.textMuted || "#3D5A7A")} 
        />
        <Text style={[styles.tabText, activeTab === "settings" && styles.activeTabText]}>Weaving</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVocabItem = ({ item }: { item: VocabWord }) => (
    <View style={styles.vocabCard}>
      <View style={styles.vocabHeader}>
        <View>
          <Text style={styles.vocabWord}>{item.word}</Text>
          <Text style={styles.vocabTranslation}>{item.translation}</Text>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveWord(item.id)}
        >
          <Ionicons name="close-circle" size={24} color={Colors.textMuted || "#3D5A7A"} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Struggle</Text>
          <View style={styles.scoreContainer}>
            <Text style={[styles.statValue, { color: getScoreColor(item.struggleScore) }]}>
              {item.struggleScore}
            </Text>
            <Ionicons name="flame" size={14} color={getScoreColor(item.struggleScore)} />
          </View>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mastery</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${item.masteryProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{item.masteryProgress}%</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Next in</Text>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color={Colors.secondary || "#00AAFF"} />
            <Text style={styles.timeText}>{formatTimeUntil(item.nextAppearance)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.contextsContainer}>
        {item.contexts.map((ctx, idx) => (
          <View key={idx} style={styles.contextBadge}>
            <Text style={styles.contextBadgeText}>{ctx}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderListTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Weak Words ({vocabList.length})</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsAddModalVisible(true);
          }}
        >
          <Ionicons name="add" size={20} color={Colors.primary || "#040810"} />
          <Text style={styles.addButtonText}>Add Word</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={vocabList.sort((a, b) => b.struggleScore - a.struggleScore)}
        keyExtractor={(item) => item.id}
        renderItem={renderVocabItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color={Colors.success || "#34C759"} />
            <Text style={styles.emptyText}>You have mastered all words!</Text>
            <Text style={styles.emptySubtext}>Add new words to start tracking.</Text>
          </View>
        }
      />
    </View>
  );

  const renderCloudTab = () => {
    // Simple simulation of a word cloud using flex wrap and varying font sizes
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Struggle Cloud</Text>
        <Text style={styles.sectionDescription}>
          Words you struggle with most appear larger.
        </Text>
        
        <View style={styles.cloudContainer}>
          {vocabList.map((item) => {
            // Calculate font size based on struggle score (min 14, max 36)
            const fontSize = 14 + (item.struggleScore / 100) * 22;
            const opacity = 0.5 + (item.struggleScore / 100) * 0.5;
            const color = getScoreColor(item.struggleScore);
            
            return (
              <View key={item.id} style={styles.cloudWordContainer}>
                <Text 
                  style={[
                    styles.cloudWord, 
                    { fontSize, color, opacity }
                  ]}
                >
                  {item.word}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Context Weaving</Text>
      <Text style={styles.sectionDescription}>
        Select where your weak vocabulary should be naturally reintroduced.
      </Text>

      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="chatbubbles-outline" size={22} color={Colors.secondary || "#00AAFF"} />
            </View>
            <View>
              <Text style={styles.settingTitle}>AI Conversations</Text>
              <Text style={styles.settingDescription}>AI will naturally use these words</Text>
            </View>
          </View>
          <Switch
            value={settings.conversations}
            onValueChange={() => toggleSetting("conversations")}
            trackColor={{ false: Colors.surfaceCard || "#0A1628", true: Colors.glow || "#00CCFF" }}
            thumbColor={Platform.OS === "ios" ? "#FFFFFF" : settings.conversations ? "#FFFFFF" : "#f4f3f4"}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="albums-outline" size={22} color={Colors.secondary || "#00AAFF"} />
            </View>
            <View>
              <Text style={styles.settingTitle}>Flashcards</Text>
              <Text style={styles.settingDescription}>Prioritize in daily reviews</Text>
            </View>
          </View>
          <Switch
            value={settings.flashcards}
            onValueChange={() => toggleSetting("flashcards")}
            trackColor={{ false: Colors.surfaceCard || "#0A1628", true: Colors.glow || "#00CCFF" }}
            thumbColor={Platform.OS === "ios" ? "#FFFFFF" : settings.flashcards ? "#FFFFFF" : "#f4f3f4"}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="book-outline" size={22} color={Colors.secondary || "#00AAFF"} />
            </View>
            <View>
              <Text style={styles.settingTitle}>Generated Stories</Text>
              <Text style={styles.settingDescription}>Weave into reading materials</Text>
            </View>
          </View>
          <Switch
            value={settings.stories}
            onValueChange={() => toggleSetting("stories")}
            trackColor={{ false: Colors.surfaceCard || "#0A1628", true: Colors.glow || "#00CCFF" }}
            thumbColor={Platform.OS === "ios" ? "#FFFFFF" : settings.stories ? "#FFFFFF" : "#f4f3f4"}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="musical-notes-outline" size={22} color={Colors.secondary || "#00AAFF"} />
            </View>
            <View>
              <Text style={styles.settingTitle}>Songs & Lyrics</Text>
              <Text style={styles.settingDescription}>Include in listening exercises</Text>
            </View>
          </View>
          <Switch
            value={settings.songs}
            onValueChange={() => toggleSetting("songs")}
            trackColor={{ false: Colors.surfaceCard || "#0A1628", true: Colors.glow || "#00CCFF" }}
            thumbColor={Platform.OS === "ios" ? "#FFFFFF" : settings.songs ? "#FFFFFF" : "#f4f3f4"}
          />
        </View>
      </View>
      
      <View style={styles.srsInfoContainer}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary || "#7EB8E0"} />
        <Text style={styles.srsInfoText}>
          Our Spaced Repetition System (SRS) automatically schedules words based on your struggle score. Higher scores mean more frequent appearances.
        </Text>
      </View>
    </View>
  );

  const renderAddModal = () => (
    <Modal
      visible={isAddModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsAddModalVisible(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Weak Word</Text>
            <TouchableOpacity 
              onPress={() => setIsAddModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary || "#FFFFFF"} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Word</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Serendipity"
              placeholderTextColor={Colors.textMuted || "#3D5A7A"}
              value={newWord}
              onChangeText={setNewWord}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Translation / Meaning</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Happy accident"
              placeholderTextColor={Colors.textMuted || "#3D5A7A"}
              value={newTranslation}
              onChangeText={setNewTranslation}
            />
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleAddWord}
          >
            <Text style={styles.saveButtonText}>Add to SRS List</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (isLoading) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading SRS Data...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <View style={styles.container}>
        {renderHeader()}
        {renderTabs()}
        
        <View style={styles.contentContainer}>
          {activeTab === "list" && renderListTab()}
          {activeTab === "cloud" && renderCloudTab()}
          {activeTab === "settings" && renderSettingsTab()}
        </View>
      </View>
      
      {renderAddModal()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary || "#040810",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary || "#040810",
  },
  loadingText: {
    color: Colors.glow || "#00CCFF",
    fontSize: FontSize?.md || 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing?.md || 16,
    paddingVertical: Spacing?.sm || 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "#1A2942",
  },
  backButton: {
    padding: Spacing?.xs || 4,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    color: Colors.textPrimary || "#FFFFFF",
    fontSize: FontSize?.lg || 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: Colors.secondary || "#00AAFF",
    fontSize: FontSize?.xs || 12,
    fontWeight: "500",
  },
  exportButton: {
    padding: Spacing?.xs || 4,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing?.md || 16,
    paddingVertical: Spacing?.sm || 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "#1A2942",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing?.sm || 8,
    gap: Spacing?.xs || 6,
    borderRadius: BorderRadius?.md || 8,
  },
  activeTab: {
    backgroundColor: "rgba(0, 204, 255, 0.1)",
  },
  tabText: {
    color: Colors.textMuted || "#3D5A7A",
    fontSize: FontSize?.sm || 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: Colors.glow || "#00CCFF",
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: Spacing?.md || 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing?.md || 16,
  },
  sectionTitle: {
    color: Colors.textPrimary || "#FFFFFF",
    fontSize: FontSize?.xl || 20,
    fontWeight: "bold",
  },
  sectionDescription: {
    color: Colors.textSecondary || "#7EB8E0",
    fontSize: FontSize?.sm || 14,
    marginBottom: Spacing?.lg || 20,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.glow || "#00CCFF",
    paddingHorizontal: Spacing?.sm || 12,
    paddingVertical: Spacing?.xs || 6,
    borderRadius: BorderRadius?.full || 9999,
    gap: 4,
  },
  addButtonText: {
    color: Colors.primary || "#040810",
    fontWeight: "bold",
    fontSize: FontSize?.sm || 14,
  },
  listContainer: {
    paddingBottom: Spacing?.xl || 32,
  },
  vocabCard: {
    backgroundColor: Colors.surfaceCard || "#0A1628",
    borderRadius: BorderRadius?.lg || 12,
    padding: Spacing?.md || 16,
    marginBottom: Spacing?.md || 16,
    borderWidth: 1,
    borderColor: Colors.border || "#1A2942",
  },
  vocabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing?.md || 16,
  },
  vocabWord: {
    color: Colors.textPrimary || "#FFFFFF",
    fontSize: FontSize?.lg || 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  vocabTranslation: {
    color: Colors.textSecondary || "#7EB8E0",
    fontSize: FontSize?.sm || 14,
  },
  removeButton: {
    padding: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing?.md || 16,
    backgroundColor: "rgba(4, 8, 16, 0.5)",
    padding: Spacing?.sm || 12,
    borderRadius: BorderRadius?.md || 8,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: Colors.textMuted || "#3D5A7A",
    fontSize: FontSize?.xs || 12,
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: FontSize?.md || 16,
    fontWeight: "bold",
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.border || "#1A2942",
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 4,
    width: "80%",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.success || "#34C759",
    borderRadius: 3,
  },
  progressText: {
    color: Colors.textPrimary || "#FFFFFF",
    fontSize: FontSize?.xs || 12,
    fontWeight: "600",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    color: Colors.secondary || "#00AAFF",
    fontSize: FontSize?.sm || 14,
    fontWeight: "600",
  },
  contextsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing?.xs || 8,
  },
  contextBadge: {
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    paddingHorizontal: Spacing?.sm || 10,
    paddingVertical: 4,
    borderRadius: BorderRadius?.sm || 6,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.3)",
  },
  contextBadgeText: {
    color: Colors.secondary || "#00AAFF",
    fontSize: FontSize?.xs || 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing?.xxl || 48,
  },
  emptyText: {
    color: Colors.textPrimary || "#FFFFFF",
    fontSize: FontSize?.lg || 18,
    fontWeight: "bold",
    marginTop: Spacing?.md || 16,
    marginBottom: Spacing?.xs || 8,
  },
  emptySubtext: {
    color: Colors.textSecondary || "#7EB8E0",
    fontSize: FontSize?.sm || 14,
    textAlign: "center",
  },
  cloudContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing?.lg || 20,
    backgroundColor: Colors.surfaceCard || "#0A1628",
    borderRadius: BorderRadius?.lg || 12,
    borderWidth: 1,
    borderColor: Colors.border || "#1A2942",
    minHeight: 300,
  },
  cloudWordContainer: {
    margin: Spacing?.sm || 8,
  },
  cloudWord: {
    fontWeight: "bold",
    textAlign: "center",
  },
  settingsCard: {
    backgroundColor: Colors.surfaceCard || "#0A1628",
    borderRadius: BorderRadius?.lg || 12,
    borderWidth: 1,
    borderColor: Colors.border || "#1A2942",
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing?.md || 16,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius?.md || 8,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing?.md || 16,
  },
  settingTitle: {
    color: Colors.textPrimary || "#FFFFFF",
    fontSize: FontSize?.md || 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingDescription: {
    color: Colors.textSecondary || "#7EB8E0",
    fontSize: FontSize?.xs || 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border || "#1A2942",
    marginLeft: 72, // Align with text
  },
  srsInfoContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(126, 184, 224, 0.1)",
    padding: Spacing?.md || 16,
    borderRadius: BorderRadius?.md || 8,
    marginTop: Spacing?.xl || 24,
    gap: Spacing?.sm || 12,
  },
  srsInfoText: {
    flex: 1,
    color: Colors.textSecondary || "#7EB8E0",
    fontSize: FontSize?.sm || 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(4, 8, 16, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surfaceCard || "#0A1628",
    borderTopLeftRadius: BorderRadius?.xl || 24,
    borderTopRightRadius: BorderRadius?.xl || 24,
    padding: Spacing?.lg || 20,
    borderWidth: 1,
    borderColor: Colors.border || "#1A2942",
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing?.lg || 20,
  },
  modalTitle: {
    color: Colors.textPrimary || "#FFFFFF",
    fontSize: FontSize?.xl || 20,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: Spacing?.md || 16,
  },
  inputLabel: {
    color: Colors.textSecondary || "#7EB8E0",
    fontSize: FontSize?.sm || 14,
    fontWeight: "600",
    marginBottom: Spacing?.xs || 8,
  },
  input: {
    backgroundColor: Colors.primary || "#040810",
    borderWidth: 1,
    borderColor: Colors.border || "#1A2942",
    borderRadius: BorderRadius?.md || 8,
    padding: Spacing?.md || 16,
    color: Colors.textPrimary || "#FFFFFF",
    fontSize: FontSize?.md || 16,
  },
  saveButton: {
    backgroundColor: Colors.glow || "#00CCFF",
    borderRadius: BorderRadius?.md || 8,
    padding: Spacing?.md || 16,
    alignItems: "center",
    marginTop: Spacing?.md || 16,
    marginBottom: Spacing?.xl || 32,
  },
  saveButtonText: {
    color: Colors.primary || "#040810",
    fontSize: FontSize?.md || 16,
    fontWeight: "bold",
  },
});
