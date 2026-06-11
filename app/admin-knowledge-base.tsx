import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";

const LANGUAGES = [
  "Spanish", "French", "Portuguese", "Arabic", "Chinese", "Hindi",
  "Japanese", "Korean", "German", "Italian", "Russian", "Turkish",
  "Swahili", "Yoruba", "Igbo", "Hausa", "Amharic", "Thai",
  "Vietnamese", "Tagalog", "Indonesian", "Polish", "Dutch",
  "Greek", "Hebrew", "Persian", "Urdu", "Bengali", "Tamil",
];

const DIALECTS: Record<string, string[]> = {
  Spanish: ["Standard", "Dominican", "Venezuelan", "Colombian", "Mexican", "Puerto Rican", "Cuban", "Argentine", "Chilean", "Peruvian", "Ecuadorian"],
  Portuguese: ["Standard", "Brazilian", "European", "Angolan", "Mozambican"],
  French: ["Standard", "Parisian", "Quebec", "African", "Haitian Creole", "Belgian"],
  Arabic: ["Standard", "Egyptian", "Levantine", "Gulf", "Moroccan", "Iraqi", "Tunisian"],
  Chinese: ["Standard", "Mandarin", "Cantonese", "Taiwanese", "Shanghainese"],
  English: ["Standard", "American", "British", "Australian", "Nigerian", "Jamaican", "South African"],
  Hindi: ["Standard", "Mumbai", "Delhi", "Bihari"],
  Japanese: ["Standard", "Kansai", "Tokyo"],
  Korean: ["Standard", "Seoul", "Busan"],
  German: ["Standard", "Austrian", "Swiss"],
  Italian: ["Standard", "Neapolitan", "Sicilian", "Roman"],
  Swahili: ["Standard", "Kenyan", "Tanzanian"],
};

type SeedChannelData = {
  id: string;
  url: string;
  name: string;
  platform: string;
  language: string;
  dialect: string;
  isActive: boolean;
  lastChecked: string | null;
  lastNewContent: string | null;
  totalIngested: number;
  addedAt: string;
};

type Suggestion = {
  name: string;
  url: string;
  platform: string;
  description: string;
  whyRecommended: string;
};

export default function AdminKnowledgeBaseScreen() {
  // Seed channel form
  const [channelUrl, setChannelUrl] = useState("");
  const [channelName, setChannelName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("Spanish");
  const [selectedDialect, setSelectedDialect] = useState("Dominican");
  const [showAddChannel, setShowAddChannel] = useState(false);

  // Manual single URL form
  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [showManualIngest, setShowManualIngest] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);

  // Discovery
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [discoveryLanguage, setDiscoveryLanguage] = useState("Spanish");
  const [discoveryDialect, setDiscoveryDialect] = useState("Dominican");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Auto-run
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  // Status messages
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // tRPC hooks
  const { data: channelsData, refetch: refetchChannels } = trpc.autoIngest.listSeedChannels.useQuery();
  const addChannelMutation = trpc.autoIngest.addSeedChannel.useMutation();
  const removeChannelMutation = trpc.autoIngest.removeSeedChannel.useMutation();
  const toggleChannelMutation = trpc.autoIngest.toggleSeedChannel.useMutation();
  const triggerMutation = trpc.autoIngest.triggerIngestion.useMutation();
  const discoverMutation = trpc.autoIngest.discoverTeachers.useMutation();
  const ingestMutation = trpc.teacher.ingestContent.useMutation();

  const availableDialects = DIALECTS[selectedLanguage] || ["Standard"];
  const discoveryDialects = DIALECTS[discoveryLanguage] || ["Standard"];

  const handleAddChannel = async () => {
    if (!channelUrl.trim()) {
      Alert.alert("Error", "Please enter a channel/account URL");
      return;
    }

    try {
      const result = await addChannelMutation.mutateAsync({
        url: channelUrl.trim(),
        name: channelName.trim() || undefined,
        language: selectedLanguage,
        dialect: selectedDialect,
      });

      if (result.success) {
        setStatusMessage({ type: "success", text: result.message });
        setChannelUrl("");
        setChannelName("");
        setShowAddChannel(false);
        refetchChannels();
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to add channel" });
    }
  };

  const handleRemoveChannel = (id: string, name: string) => {
    Alert.alert(
      "Remove Source",
      `Stop auto-ingesting from "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeChannelMutation.mutateAsync({ id });
              refetchChannels();
            } catch (err) {
              Alert.alert("Error", "Failed to remove");
            }
          },
        },
      ]
    );
  };

  const handleToggleChannel = async (id: string, isActive: boolean) => {
    try {
      await toggleChannelMutation.mutateAsync({ id, isActive });
      refetchChannels();
    } catch (err) {
      Alert.alert("Error", "Failed to toggle");
    }
  };

  const handleTriggerRun = async () => {
    setIsRunning(true);
    setRunResult(null);
    try {
      const result = await triggerMutation.mutateAsync();
      setRunResult(result.message);
    } catch (err: any) {
      setRunResult(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setSuggestions([]);
    try {
      const result = await discoverMutation.mutateAsync({
        language: discoveryLanguage,
        dialect: discoveryDialect,
      });
      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Discovery failed");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleAddSuggestion = async (suggestion: Suggestion) => {
    try {
      const result = await addChannelMutation.mutateAsync({
        url: suggestion.url,
        name: suggestion.name,
        language: discoveryLanguage,
        dialect: discoveryDialect,
      });
      if (result.success) {
        setStatusMessage({ type: "success", text: `Added "${suggestion.name}" to auto-ingestion!` });
        refetchChannels();
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add");
    }
  };

  const handleManualIngest = async () => {
    if (!manualUrl.trim()) {
      Alert.alert("Error", "Please enter a URL");
      return;
    }
    setIsIngesting(true);
    try {
      const result = await ingestMutation.mutateAsync({
        url: manualUrl.trim(),
        language: selectedLanguage,
        dialect: selectedDialect,
        title: manualTitle.trim() || undefined,
      });
      if (result.success) {
        setStatusMessage({ type: "success", text: "Content ingested and validated!" });
        setManualUrl("");
        setManualTitle("");
      } else {
        setStatusMessage({ type: "error", text: result.error || "Ingestion failed" });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setIsIngesting(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube": return "logo-youtube";
      case "instagram": return "logo-instagram";
      case "tiktok": return "musical-notes";
      default: return "globe";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "youtube": return "#FF0000";
      case "instagram": return "#E1306C";
      case "tiktok": return "#00F2EA";
      default: return Colors.secondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Knowledge Base</Text>
          <Text style={styles.headerSubtitle}>Auto-Ingestion Manager</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="school" size={16} color={Colors.gold} />
          <Text style={styles.headerBadgeText}>ADMIN</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* First-Time User: Feed Your First Content */}
        {(!channelsData?.channels || channelsData.channels.length === 0) && !showManualIngest && !showAddChannel && (
          <View style={styles.firstTimeCard}>
            <View style={styles.firstTimeIconWrap}>
              <Ionicons name="logo-youtube" size={32} color="#FF0000" />
            </View>
            <Text style={styles.firstTimeTitle}>Feed Your First Teaching Content</Text>
            <Text style={styles.firstTimeDesc}>
              Paste a YouTube URL of a Dominican Spanish teacher (or any language teacher) and watch it get scraped, transcribed, and stored as teaching material for your AI.
            </Text>
            <View style={styles.firstTimeInputWrap}>
              <Ionicons name="link" size={18} color={Colors.textMuted} style={{ marginLeft: 12 }} />
              <TextInput
                style={styles.firstTimeInput}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor={Colors.textMuted}
                value={manualUrl}
                onChangeText={setManualUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
            <TouchableOpacity
              style={[styles.firstTimeBtn, isIngesting && styles.submitBtnDisabled]}
              onPress={handleManualIngest}
              disabled={isIngesting}
            >
              {isIngesting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.firstTimeBtnText}>Scraping & Storing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                  <Text style={styles.firstTimeBtnText}>Ingest Content</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.firstTimeHint}>
              Supports: YouTube videos, Instagram posts, TikTok clips
            </Text>
          </View>
        )}

        {/* Status Message */}
        {statusMessage && (
          <View style={[styles.statusBanner, statusMessage.type === "success" ? styles.statusSuccess : styles.statusError]}>
            <Ionicons
              name={statusMessage.type === "success" ? "checkmark-circle" : "alert-circle"}
              size={18}
              color={statusMessage.type === "success" ? Colors.success : Colors.error}
            />
            <Text style={[styles.statusText, { color: statusMessage.type === "success" ? Colors.success : Colors.error }]}>
              {statusMessage.text}
            </Text>
            <TouchableOpacity onPress={() => setStatusMessage(null)}>
              <Ionicons name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* How It Works - Auto Mode */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="flash" size={20} color={Colors.gold} />
            <Text style={styles.infoTitle}>Automatic Mode</Text>
          </View>
          <Text style={styles.infoText}>
            Add seed channels once — the system automatically checks for new content daily, scrapes it, validates accuracy with AI, and feeds it to your teachers. You don't have to do anything after setup.
          </Text>
          <View style={styles.infoPipeline}>
            <View style={styles.pipelineStep}>
              <Ionicons name="add-circle" size={16} color={Colors.glow} />
              <Text style={styles.pipelineText}>Seed</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
            <View style={styles.pipelineStep}>
              <Ionicons name="time" size={16} color={Colors.glow} />
              <Text style={styles.pipelineText}>Daily</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
            <View style={styles.pipelineStep}>
              <Ionicons name="cloud-download" size={16} color={Colors.glow} />
              <Text style={styles.pipelineText}>Scrape</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
            <View style={styles.pipelineStep}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.gold} />
              <Text style={styles.pipelineText}>Validate</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
            <View style={styles.pipelineStep}>
              <Ionicons name="school" size={16} color={Colors.success} />
              <Text style={styles.pipelineText}>Teach</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{channelsData?.total || 0}</Text>
            <Text style={styles.statLabel}>Sources</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{channelsData?.active || 0}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {channelsData?.channels?.reduce((sum: number, c: SeedChannelData) => sum + c.totalIngested, 0) || 0}
            </Text>
            <Text style={styles.statLabel}>Ingested</Text>
          </View>
        </View>

        {/* Run Now Button */}
        <TouchableOpacity
          style={[styles.runNowBtn, isRunning && styles.runNowBtnDisabled]}
          onPress={handleTriggerRun}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <ActivityIndicator size="small" color={Colors.textPrimary} />
              <Text style={styles.runNowText}>Checking all channels...</Text>
            </>
          ) : (
            <>
              <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
              <Text style={styles.runNowText}>Run Ingestion Now</Text>
            </>
          )}
        </TouchableOpacity>
        {runResult && (
          <Text style={styles.runResultText}>{runResult}</Text>
        )}

        {/* Seed Channels List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Seed Channels</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddChannel(!showAddChannel)}
            >
              <Ionicons name={showAddChannel ? "close" : "add"} size={20} color={Colors.secondary} />
              <Text style={styles.addBtnText}>{showAddChannel ? "Cancel" : "Add"}</Text>
            </TouchableOpacity>
          </View>

          {/* Add Channel Form */}
          {showAddChannel && (
            <View style={styles.addForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Channel / Account URL</Text>
                <View style={styles.urlInputWrap}>
                  <Ionicons name="link" size={18} color={Colors.textMuted} style={styles.urlIcon} />
                  <TextInput
                    style={styles.urlInput}
                    placeholder="https://youtube.com/@channel or instagram.com/account"
                    placeholderTextColor={Colors.textMuted}
                    value={channelUrl}
                    onChangeText={setChannelUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Bilingue Blogs"
                  placeholderTextColor={Colors.textMuted}
                  value={channelName}
                  onChangeText={setChannelName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Language</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {LANGUAGES.map(lang => (
                    <TouchableOpacity
                      key={lang}
                      style={[styles.chip, selectedLanguage === lang && styles.chipActive]}
                      onPress={() => {
                        setSelectedLanguage(lang);
                        setSelectedDialect(DIALECTS[lang]?.[0] || "Standard");
                      }}
                    >
                      <Text style={[styles.chipText, selectedLanguage === lang && styles.chipTextActive]}>
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dialect / Variant</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {availableDialects.map(dialect => (
                    <TouchableOpacity
                      key={dialect}
                      style={[styles.chip, selectedDialect === dialect && styles.chipActiveGold]}
                      onPress={() => setSelectedDialect(dialect)}
                    >
                      <Text style={[styles.chipText, selectedDialect === dialect && styles.chipTextActiveGold]}>
                        {dialect}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAddChannel}
                disabled={addChannelMutation.isPending}
              >
                {addChannelMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.textPrimary} />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color={Colors.textPrimary} />
                    <Text style={styles.submitBtnText}>Add Seed Channel</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Channel List */}
          {channelsData?.channels && channelsData.channels.length > 0 ? (
            channelsData.channels.map((channel: SeedChannelData) => (
              <View key={channel.id} style={styles.channelCard}>
                <View style={styles.channelTop}>
                  <View style={[styles.platformBadge, { backgroundColor: `${getPlatformColor(channel.platform)}20` }]}>
                    <Ionicons
                      name={getPlatformIcon(channel.platform) as any}
                      size={18}
                      color={getPlatformColor(channel.platform)}
                    />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelName}>{channel.name}</Text>
                    <Text style={styles.channelMeta}>
                      {channel.language} • {channel.dialect} • {channel.totalIngested} ingested
                    </Text>
                  </View>
                  <Switch
                    value={channel.isActive}
                    onValueChange={(val) => handleToggleChannel(channel.id, val)}
                    trackColor={{ false: Colors.border, true: Colors.success + "60" }}
                    thumbColor={channel.isActive ? Colors.success : Colors.textMuted}
                  />
                </View>
                <View style={styles.channelBottom}>
                  <Text style={styles.channelUrl} numberOfLines={1}>{channel.url}</Text>
                  {channel.lastChecked && (
                    <Text style={styles.channelLastChecked}>
                      Last checked: {new Date(channel.lastChecked).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveChannel(channel.id, channel.name)}
                >
                  <Ionicons name="trash-outline" size={14} color={Colors.error} />
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="radio-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Seed Channels</Text>
              <Text style={styles.emptyText}>
                Add YouTube channels or Instagram accounts to automatically feed your AI teachers with fresh content.
              </Text>
            </View>
          )}
        </View>

        {/* AI Auto-Discovery */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionToggle}
            onPress={() => setShowDiscovery(!showDiscovery)}
          >
            <View style={styles.sectionToggleLeft}>
              <Ionicons name="sparkles" size={20} color={Colors.gold} />
              <Text style={styles.sectionToggleText}>AI Auto-Discovery</Text>
            </View>
            <Ionicons name={showDiscovery ? "chevron-up" : "chevron-down"} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          {showDiscovery && (
            <View style={styles.discoveryContent}>
              <Text style={styles.discoveryDesc}>
                Let AI find popular language teaching channels for you. Pick a language and dialect, and it'll suggest the best sources to follow.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Language to discover</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {LANGUAGES.slice(0, 12).map(lang => (
                    <TouchableOpacity
                      key={lang}
                      style={[styles.chip, discoveryLanguage === lang && styles.chipActive]}
                      onPress={() => {
                        setDiscoveryLanguage(lang);
                        setDiscoveryDialect(DIALECTS[lang]?.[0] || "Standard");
                      }}
                    >
                      <Text style={[styles.chipText, discoveryLanguage === lang && styles.chipTextActive]}>
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dialect</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {discoveryDialects.map(dialect => (
                    <TouchableOpacity
                      key={dialect}
                      style={[styles.chip, discoveryDialect === dialect && styles.chipActiveGold]}
                      onPress={() => setDiscoveryDialect(dialect)}
                    >
                      <Text style={[styles.chipText, discoveryDialect === dialect && styles.chipTextActiveGold]}>
                        {dialect}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isDiscovering && styles.submitBtnDisabled]}
                onPress={handleDiscover}
                disabled={isDiscovering}
              >
                {isDiscovering ? (
                  <>
                    <ActivityIndicator size="small" color={Colors.textPrimary} />
                    <Text style={styles.submitBtnText}>Finding teachers...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="search" size={18} color={Colors.textPrimary} />
                    <Text style={styles.submitBtnText}>Discover Teachers</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <View style={styles.suggestionsWrap}>
                  <Text style={styles.suggestionsTitle}>Recommended Sources</Text>
                  {suggestions.map((s, idx) => (
                    <View key={idx} style={styles.suggestionCard}>
                      <View style={styles.suggestionTop}>
                        <Ionicons
                          name={getPlatformIcon(s.platform) as any}
                          size={18}
                          color={getPlatformColor(s.platform)}
                        />
                        <View style={styles.suggestionInfo}>
                          <Text style={styles.suggestionName}>{s.name}</Text>
                          <Text style={styles.suggestionDesc} numberOfLines={2}>{s.description}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.addSuggestionBtn}
                          onPress={() => handleAddSuggestion(s)}
                        >
                          <Ionicons name="add-circle" size={24} color={Colors.success} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.suggestionWhy} numberOfLines={2}>
                        {s.whyRecommended}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Manual Single URL Ingest (secondary) */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionToggle}
            onPress={() => setShowManualIngest(!showManualIngest)}
          >
            <View style={styles.sectionToggleLeft}>
              <Ionicons name="link" size={20} color={Colors.secondary} />
              <Text style={styles.sectionToggleText}>Manual URL Ingest</Text>
            </View>
            <Ionicons name={showManualIngest ? "chevron-up" : "chevron-down"} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          {showManualIngest && (
            <View style={styles.manualContent}>
              <Text style={styles.manualDesc}>
                Paste a specific video or post URL to immediately ingest its content. Good for one-off additions.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>URL</Text>
                <View style={styles.urlInputWrap}>
                  <Ionicons name="link" size={18} color={Colors.textMuted} style={styles.urlIcon} />
                  <TextInput
                    style={styles.urlInput}
                    placeholder="https://youtube.com/watch?v=... or instagram.com/p/..."
                    placeholderTextColor={Colors.textMuted}
                    value={manualUrl}
                    onChangeText={setManualUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Dominican Slang Lesson"
                  placeholderTextColor={Colors.textMuted}
                  value={manualTitle}
                  onChangeText={setManualTitle}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isIngesting && styles.submitBtnDisabled]}
                onPress={handleManualIngest}
                disabled={isIngesting}
              >
                {isIngesting ? (
                  <>
                    <ActivityIndicator size="small" color={Colors.textPrimary} />
                    <Text style={styles.submitBtnText}>Scraping & Validating...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={18} color={Colors.textPrimary} />
                    <Text style={styles.submitBtnText}>Ingest Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 184, 0, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  headerBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gold,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  // Status Banner
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  statusSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  statusError: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  statusText: {
    flex: 1,
    fontSize: FontSize.sm,
  },
  // Info Card
  infoCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoPipeline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pipelineStep: {
    alignItems: "center",
    gap: 2,
  },
  pipelineText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  // Stats
  statsBar: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  // Run Now
  runNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 8,
  },
  runNowBtnDisabled: {
    opacity: 0.6,
  },
  runNowText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  runResultText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  // Section
  section: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sectionToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionToggleText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  // Add Button
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
  },
  addBtnText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "500",
  },
  // Add Form
  addForm: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  urlInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  urlIcon: {
    marginRight: 8,
  },
  urlInput: {
    flex: 1,
    height: 44,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  textInput: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 44,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "rgba(0, 170, 255, 0.15)",
    borderColor: Colors.secondary,
  },
  chipActiveGold: {
    backgroundColor: "rgba(255, 184, 0, 0.15)",
    borderColor: Colors.gold,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.secondary,
    fontWeight: "600",
  },
  chipTextActiveGold: {
    color: Colors.gold,
    fontWeight: "600",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  // Channel Card
  channelCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  channelTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  platformBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  channelMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  channelBottom: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  channelUrl: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  channelLastChecked: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    alignSelf: "flex-end",
  },
  removeBtnText: {
    fontSize: FontSize.xs,
    color: Colors.error,
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  // Discovery
  discoveryContent: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  discoveryDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  suggestionsWrap: {
    marginTop: Spacing.md,
  },
  suggestionsTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  suggestionCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  suggestionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addSuggestionBtn: {
    padding: 4,
  },
  suggestionWhy: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 6,
    fontStyle: "italic",
  },
  // Manual Ingest
  manualContent: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  manualDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  // First-Time Card
  firstTimeCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  firstTimeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  firstTimeTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  firstTimeDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  firstTimeInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
    marginBottom: Spacing.md,
  },
  firstTimeInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  firstTimeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF0000",
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    gap: 8,
    width: "100%",
  },
  firstTimeBtnText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: "#fff",
  },
  firstTimeHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
