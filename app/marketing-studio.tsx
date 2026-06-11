/**
 * Marketing Studio — Admin screen for generating promo clips
 * 
 * Features:
 * - Browse marketing templates by category/platform
 * - Generate videos with Higgsfield AI
 * - AI-generated captions and hashtags
 * - Weekly content calendar planner
 * - Platform-specific recommendations
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Linking,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface MarketingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  platform: string[];
  aspectRatio: string;
  duration: number;
  style: string;
}

interface GeneratedVideo {
  id: string;
  templateId: string;
  platform: string;
  status: "queued" | "processing" | "completed" | "failed";
  prompt: string;
  caption?: string;
  hashtags?: string[];
  videoUrl?: string;
  createdAt: string;
}

interface WeeklyPlanEntry {
  day: string;
  platform: string;
  templateId: string;
  caption_hint: string;
  best_time: string;
}

// ─── Template Data (mirrors server) ─────────────────────────────────────────────

const TEMPLATES: MarketingTemplate[] = [
  {
    id: "feature-hd-voice",
    name: "HD Voice Translation",
    description: "Showcase ElevenLabs HD Voice — crystal-clear translations",
    category: "feature_promo",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 15,
    style: "cinematic, tech, premium",
  },
  {
    id: "feature-live-translate",
    name: "Live Translation Demo",
    description: "Real-time conversation translation in action",
    category: "feature_promo",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 20,
    style: "lifestyle, warm, relatable",
  },
  {
    id: "feature-ai-teachers",
    name: "Meet Your AI Teachers",
    description: "Introduce the diverse cast of AI language teachers",
    category: "feature_promo",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 15,
    style: "energetic, diverse, colorful",
  },
  {
    id: "feature-dominican-slang",
    name: "Dominican Slang Lesson",
    description: "Quick Dominican Spanish slang — engaging and educational",
    category: "language_tip",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 15,
    style: "vibrant, Caribbean, educational",
  },
  {
    id: "trending-before-after",
    name: "Before/After Learning",
    description: "Trending before/after showing language progress",
    category: "trending",
    platform: ["instagram", "tiktok"],
    aspectRatio: "9:16",
    duration: 12,
    style: "trending, viral, split-screen",
  },
  {
    id: "trending-day-in-life",
    name: "Day in Life with ConnectWorld AI",
    description: "Day-in-the-life format with the app in daily scenarios",
    category: "trending",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 30,
    style: "lifestyle, aspirational, daily",
  },
  {
    id: "showcase-connectworld-tv",
    name: "ConnectWorld AI TV Preview",
    description: "Netflix-style preview of AI TV learning series",
    category: "app_showcase",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 20,
    style: "premium, streaming, cinematic",
  },
  {
    id: "showcase-video-call",
    name: "AI Video Call Feature",
    description: "Live AI video call with real-time translation",
    category: "app_showcase",
    platform: ["instagram", "tiktok"],
    aspectRatio: "9:16",
    duration: 15,
    style: "futuristic, tech, communication",
  },
  {
    id: "referral-invite",
    name: "Invite Friends Promo",
    description: "Encourage referrals with bonus credits incentive",
    category: "referral",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 10,
    style: "social, rewarding, fun",
  },
  {
    id: "testimonial-success",
    name: "Success Story",
    description: "User success story — before/after language confidence",
    category: "testimonial",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 20,
    style: "emotional, authentic, aspirational",
  },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: "grid" },
  { id: "feature_promo", label: "Features", icon: "star" },
  { id: "trending", label: "Trending", icon: "trending-up" },
  { id: "language_tip", label: "Tips", icon: "school" },
  { id: "app_showcase", label: "Showcase", icon: "phone-portrait" },
  { id: "testimonial", label: "Stories", icon: "heart" },
  { id: "referral", label: "Growth", icon: "people" },
];

const PLATFORMS = [
  { id: "all", label: "All", icon: "apps" },
  { id: "instagram", label: "Instagram", icon: "logo-instagram" },
  { id: "tiktok", label: "TikTok", icon: "musical-notes" },
  { id: "youtube_shorts", label: "Shorts", icon: "logo-youtube" },
];

// ─── Component ──────────────────────────────────────────────────────────────────

export default function MarketingStudioScreen() {
  const Colors = useColors();
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<"templates" | "generate" | "calendar" | "tips">("templates");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplate | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanEntry[]>([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");

  // Filtered templates
  const filteredTemplates = TEMPLATES.filter(t => {
    if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
    if (selectedPlatform !== "all" && !t.platform.includes(selectedPlatform)) return false;
    return true;
  });

  // Handlers
  const handleGenerateVideo = useCallback(async (template: MarketingTemplate, platform: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setGeneratingVideo(true);

    try {
      // In production, this calls the tRPC endpoint
      // For now, simulate the generation
      const newVideo: GeneratedVideo = {
        id: `vid_${Date.now()}`,
        templateId: template.id,
        platform,
        status: "queued",
        prompt: customPrompt || `Auto-generated for ${template.name}`,
        caption: `Learn languages the smart way with ConnectWorld AI 🌍✨ ${template.name} is now live!`,
        hashtags: ["ConnectWorldAI", "LanguageLearning", "AITranslation", "LearnSpanish", "DominicanSpanish"],
        createdAt: new Date().toISOString(),
      };

      setGeneratedVideos(prev => [newVideo, ...prev]);
      setSelectedTemplate(null);
      setCustomPrompt("");

      Alert.alert(
        "Video Queued! 🎬",
        `"${template.name}" is being generated for ${platform}. You'll be notified when it's ready.`,
        [{ text: "OK" }]
      );
    } catch (error: any) {
      Alert.alert("Generation Failed", error.message || "Please try again.");
    } finally {
      setGeneratingVideo(false);
    }
  }, [customPrompt]);

  const handleGenerateWeeklyPlan = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setGeneratingPlan(true);

    try {
      // Simulated weekly plan (in production calls tRPC)
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const plan: WeeklyPlanEntry[] = days.map((day, i) => ({
        day,
        platform: ["instagram", "tiktok", "youtube_shorts"][i % 3],
        templateId: TEMPLATES[i % TEMPLATES.length].id,
        caption_hint: TEMPLATES[i % TEMPLATES.length].description,
        best_time: ["9:00 AM", "12:00 PM", "3:00 PM", "6:00 PM", "8:00 PM", "10:00 AM", "2:00 PM"][i],
      }));
      setWeeklyPlan(plan);
    } catch (error: any) {
      Alert.alert("Error", "Failed to generate plan. Try again.");
    } finally {
      setGeneratingPlan(false);
    }
  }, []);

  // ─── Render Functions ───────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: Colors.border }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: Colors.foreground }]}>Marketing Studio</Text>
        <Text style={[styles.headerSubtitle, { color: Colors.muted }]}>Powered by Higgsfield AI</Text>
      </View>
      <TouchableOpacity style={[styles.settingsButton, { backgroundColor: Colors.surface }]}>
        <Ionicons name="settings-outline" size={20} color={Colors.muted} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabBar, { backgroundColor: Colors.surface }]}>
      {[
        { id: "templates", label: "Templates", icon: "layers" },
        { id: "generate", label: "Generated", icon: "videocam" },
        { id: "calendar", label: "Calendar", icon: "calendar" },
        { id: "tips", label: "Tips", icon: "bulb" },
      ].map(tab => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => {
            setActiveTab(tab.id as any);
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[
            styles.tab,
            activeTab === tab.id && { borderBottomColor: Colors.primary, borderBottomWidth: 2 },
          ]}
        >
          <Ionicons
            name={tab.icon as any}
            size={18}
            color={activeTab === tab.id ? Colors.primary : Colors.muted}
          />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === tab.id ? Colors.primary : Colors.muted },
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCategoryFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
      {CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat.id}
          onPress={() => setSelectedCategory(cat.id)}
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedCategory === cat.id ? Colors.primary : Colors.surface,
              borderColor: selectedCategory === cat.id ? Colors.primary : Colors.border,
            },
          ]}
        >
          <Ionicons
            name={cat.icon as any}
            size={14}
            color={selectedCategory === cat.id ? "#fff" : Colors.muted}
          />
          <Text style={[
            styles.filterLabel,
            { color: selectedCategory === cat.id ? "#fff" : Colors.foreground },
          ]}>
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderPlatformFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
      {PLATFORMS.map(plat => (
        <TouchableOpacity
          key={plat.id}
          onPress={() => setSelectedPlatform(plat.id)}
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedPlatform === plat.id ? Colors.primary : Colors.surface,
              borderColor: selectedPlatform === plat.id ? Colors.primary : Colors.border,
            },
          ]}
        >
          <Ionicons
            name={plat.icon as any}
            size={14}
            color={selectedPlatform === plat.id ? "#fff" : Colors.muted}
          />
          <Text style={[
            styles.filterLabel,
            { color: selectedPlatform === plat.id ? "#fff" : Colors.foreground },
          ]}>
            {plat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTemplateCard = ({ item }: { item: MarketingTemplate }) => {
    const categoryColors: Record<string, string> = {
      feature_promo: "#00AAFF",
      trending: "#FF6B35",
      language_tip: "#22C55E",
      app_showcase: "#A855F7",
      testimonial: "#EC4899",
      referral: "#F59E0B",
    };
    const accentColor = categoryColors[item.category] || Colors.primary;

    return (
      <TouchableOpacity
        onPress={() => setSelectedTemplate(item)}
        style={[styles.templateCard, { backgroundColor: Colors.surface, borderColor: Colors.border }]}
        activeOpacity={0.7}
      >
        {/* Accent bar */}
        <View style={[styles.templateAccent, { backgroundColor: accentColor }]} />
        
        <View style={styles.templateContent}>
          <View style={styles.templateHeader}>
            <Text style={[styles.templateName, { color: Colors.foreground }]}>{item.name}</Text>
            <View style={[styles.durationBadge, { backgroundColor: `${accentColor}20` }]}>
              <Text style={[styles.durationText, { color: accentColor }]}>{item.duration}s</Text>
            </View>
          </View>
          
          <Text style={[styles.templateDesc, { color: Colors.muted }]} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.templateMeta}>
            <View style={styles.platformIcons}>
              {item.platform.map(p => (
                <View key={p} style={[styles.platformDot, { backgroundColor: `${accentColor}40` }]}>
                  <Ionicons
                    name={p === "instagram" ? "logo-instagram" : p === "tiktok" ? "musical-notes" : "logo-youtube"}
                    size={12}
                    color={accentColor}
                  />
                </View>
              ))}
            </View>
            <Text style={[styles.styleTag, { color: Colors.muted }]}>{item.style.split(",")[0]}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGenerateModal = () => {
    if (!selectedTemplate) return null;

    return (
      <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.85)" }]}>
        <View style={[styles.modalContent, { backgroundColor: Colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: Colors.foreground }]}>Generate Video</Text>
            <TouchableOpacity onPress={() => setSelectedTemplate(null)}>
              <Ionicons name="close" size={24} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalTemplateName, { color: Colors.primary }]}>
            {selectedTemplate.name}
          </Text>
          <Text style={[styles.modalDesc, { color: Colors.muted }]}>
            {selectedTemplate.description}
          </Text>

          {/* Custom prompt input */}
          <Text style={[styles.inputLabel, { color: Colors.foreground }]}>Custom Prompt (optional)</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: Colors.background, color: Colors.foreground, borderColor: Colors.border }]}
            placeholder="Override the AI prompt..."
            placeholderTextColor={Colors.muted}
            value={customPrompt}
            onChangeText={setCustomPrompt}
            multiline
            numberOfLines={3}
          />

          {/* Target language */}
          <Text style={[styles.inputLabel, { color: Colors.foreground }]}>Target Language</Text>
          <View style={styles.languageRow}>
            {["Spanish", "French", "Japanese", "Arabic", "Korean"].map(lang => (
              <TouchableOpacity
                key={lang}
                onPress={() => setTargetLanguage(lang)}
                style={[
                  styles.langChip,
                  {
                    backgroundColor: targetLanguage === lang ? Colors.primary : Colors.background,
                    borderColor: targetLanguage === lang ? Colors.primary : Colors.border,
                  },
                ]}
              >
                <Text style={{ color: targetLanguage === lang ? "#fff" : Colors.foreground, fontSize: 12 }}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Platform selection */}
          <Text style={[styles.inputLabel, { color: Colors.foreground }]}>Platform</Text>
          <View style={styles.platformRow}>
            {selectedTemplate.platform.map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => handleGenerateVideo(selectedTemplate, p)}
                disabled={generatingVideo}
                style={[styles.generateButton, { backgroundColor: Colors.primary, opacity: generatingVideo ? 0.5 : 1 }]}
              >
                {generatingVideo ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name={p === "instagram" ? "logo-instagram" : p === "tiktok" ? "musical-notes" : "logo-youtube"}
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.generateButtonText}>
                      {p === "youtube_shorts" ? "Shorts" : p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderTemplatesTab = () => (
    <View style={styles.tabContent}>
      {renderCategoryFilter()}
      {renderPlatformFilter()}
      
      <FlatList
        data={filteredTemplates}
        keyExtractor={item => item.id}
        renderItem={renderTemplateCard}
        contentContainerStyle={styles.templateList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderGeneratedTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>Generated Videos</Text>
        <Text style={[styles.sectionCount, { color: Colors.muted }]}>{generatedVideos.length} clips</Text>
      </View>

      {generatedVideos.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: Colors.surface }]}>
          <Ionicons name="videocam-outline" size={48} color={Colors.muted} />
          <Text style={[styles.emptyTitle, { color: Colors.foreground }]}>No videos yet</Text>
          <Text style={[styles.emptyDesc, { color: Colors.muted }]}>
            Go to Templates and generate your first promo clip!
          </Text>
        </View>
      ) : (
        generatedVideos.map(video => {
          const template = TEMPLATES.find(t => t.id === video.templateId);
          return (
            <View key={video.id} style={[styles.videoCard, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
              <View style={styles.videoHeader}>
                <Text style={[styles.videoTitle, { color: Colors.foreground }]}>
                  {template?.name || video.templateId}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: video.status === "completed" ? "#22C55E20" : video.status === "failed" ? "#EF444420" : "#F59E0B20" },
                ]}>
                  <Text style={{
                    fontSize: 11,
                    color: video.status === "completed" ? "#22C55E" : video.status === "failed" ? "#EF4444" : "#F59E0B",
                  }}>
                    {video.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.videoCaption, { color: Colors.muted }]} numberOfLines={2}>
                {video.caption}
              </Text>
              <View style={styles.videoMeta}>
                <Ionicons
                  name={video.platform === "instagram" ? "logo-instagram" : video.platform === "tiktok" ? "musical-notes" : "logo-youtube"}
                  size={14}
                  color={Colors.muted}
                />
                <Text style={[styles.videoDate, { color: Colors.muted }]}>
                  {new Date(video.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {video.hashtags && video.hashtags.length > 0 && (
                <View style={styles.hashtagRow}>
                  {video.hashtags.slice(0, 4).map(tag => (
                    <Text key={tag} style={[styles.hashtag, { color: Colors.primary }]}>#{tag}</Text>
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );

  const renderCalendarTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>Weekly Content Plan</Text>
        <TouchableOpacity
          onPress={handleGenerateWeeklyPlan}
          disabled={generatingPlan}
          style={[styles.planButton, { backgroundColor: Colors.primary }]}
        >
          {generatingPlan ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={14} color="#fff" />
              <Text style={styles.planButtonText}>Generate Plan</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {weeklyPlan.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: Colors.surface }]}>
          <Ionicons name="calendar-outline" size={48} color={Colors.muted} />
          <Text style={[styles.emptyTitle, { color: Colors.foreground }]}>No plan yet</Text>
          <Text style={[styles.emptyDesc, { color: Colors.muted }]}>
            Tap "Generate Plan" to create an AI-optimized weekly content calendar.
          </Text>
        </View>
      ) : (
        weeklyPlan.map((entry, idx) => {
          const template = TEMPLATES.find(t => t.id === entry.templateId);
          return (
            <View key={idx} style={[styles.calendarEntry, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
              <View style={styles.calendarDay}>
                <Text style={[styles.dayText, { color: Colors.primary }]}>{entry.day.slice(0, 3)}</Text>
                <Text style={[styles.timeText, { color: Colors.muted }]}>{entry.best_time}</Text>
              </View>
              <View style={styles.calendarContent}>
                <Text style={[styles.calendarTitle, { color: Colors.foreground }]}>
                  {template?.name || entry.templateId}
                </Text>
                <Text style={[styles.calendarHint, { color: Colors.muted }]} numberOfLines={1}>
                  {entry.caption_hint}
                </Text>
              </View>
              <View style={styles.calendarPlatform}>
                <Ionicons
                  name={entry.platform === "instagram" ? "logo-instagram" : entry.platform === "tiktok" ? "musical-notes" : "logo-youtube"}
                  size={18}
                  color={Colors.muted}
                />
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  const renderTipsTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>Platform Tips</Text>
      </View>

      {/* Instagram Tips */}
      <View style={[styles.tipCard, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
        <View style={styles.tipHeader}>
          <Ionicons name="logo-instagram" size={22} color="#E4405F" />
          <Text style={[styles.tipTitle, { color: Colors.foreground }]}>Instagram Reels</Text>
        </View>
        <View style={styles.tipBody}>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Best times: 9 AM, 12 PM, 7 PM</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Optimal: 15-30 seconds</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Hook: First 1.5 seconds must grab attention</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Hashtags: Mix broad (500K+) and niche (10K-50K)</Text>
        </View>
      </View>

      {/* TikTok Tips */}
      <View style={[styles.tipCard, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
        <View style={styles.tipHeader}>
          <Ionicons name="musical-notes" size={22} color="#000" />
          <Text style={[styles.tipTitle, { color: Colors.foreground }]}>TikTok</Text>
        </View>
        <View style={styles.tipBody}>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Best times: 7 AM, 12 PM, 10 PM</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Optimal: 10-20 seconds</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Hook: First 0.5-1 second — immediate visual hook</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Hashtags: 3-5 trending + 2-3 niche</Text>
        </View>
      </View>

      {/* YouTube Shorts Tips */}
      <View style={[styles.tipCard, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
        <View style={styles.tipHeader}>
          <Ionicons name="logo-youtube" size={22} color="#FF0000" />
          <Text style={[styles.tipTitle, { color: Colors.foreground }]}>YouTube Shorts</Text>
        </View>
        <View style={styles.tipBody}>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Best times: 2 PM, 5 PM, 9 PM</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Optimal: 15-45 seconds</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Hook: First 2 seconds — clear value proposition</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Hashtags: 3 max, broad reach</Text>
        </View>
      </View>

      {/* Algorithm Notes */}
      <View style={[styles.tipCard, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
        <View style={styles.tipHeader}>
          <Ionicons name="analytics" size={22} color={Colors.primary} />
          <Text style={[styles.tipTitle, { color: Colors.foreground }]}>Algorithm Best Practices</Text>
        </View>
        <View style={styles.tipBody}>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Post consistently (3-5x/week minimum)</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Engage with comments within first hour</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Use trending audio when available</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Optimize for watch-through rate</Text>
          <Text style={[styles.tipItem, { color: Colors.muted }]}>Cross-post with platform-specific adjustments</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {renderHeader()}
      {renderTabs()}
      
      {activeTab === "templates" && renderTemplatesTab()}
      {activeTab === "generate" && renderGeneratedTab()}
      {activeTab === "calendar" && renderCalendarTab()}
      {activeTab === "tips" && renderTipsTab()}

      {/* Generate Modal */}
      {selectedTemplate && renderGenerateModal()}
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 50,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    gap: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  templateList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  templateCard: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  templateAccent: {
    width: 4,
  },
  templateContent: {
    flex: 1,
    padding: 14,
  },
  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  templateName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 11,
    fontWeight: "600",
  },
  templateDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  templateMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  platformIcons: {
    flexDirection: "row",
    gap: 4,
  },
  platformDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  styleTag: {
    fontSize: 11,
    fontStyle: "italic",
  },
  // Modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalTemplateName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 13,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: "top",
  },
  languageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  platformRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  // Generated Videos
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionCount: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },
  videoCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  videoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  videoCaption: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  videoDate: {
    fontSize: 11,
  },
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  hashtag: {
    fontSize: 11,
    fontWeight: "500",
  },
  // Calendar
  planButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  planButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  calendarEntry: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  calendarDay: {
    width: 50,
    alignItems: "center",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "700",
  },
  timeText: {
    fontSize: 10,
    marginTop: 2,
  },
  calendarContent: {
    flex: 1,
    marginLeft: 12,
  },
  calendarTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  calendarHint: {
    fontSize: 11,
    marginTop: 2,
  },
  calendarPlatform: {
    width: 30,
    alignItems: "center",
  },
  // Tips
  tipCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  tipBody: {
    gap: 6,
  },
  tipItem: {
    fontSize: 13,
    lineHeight: 18,
    paddingLeft: 8,
  },
});
