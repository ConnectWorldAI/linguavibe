/**
 * Cultural Feed Screen
 *
 * Real-time cultural content for the student's target language.
 * Shows trending music, news, viral content, cultural moments,
 * and AI friend text messages — all enriched with vocabulary.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

// ─── Types ──────────────────────────────────────────────────────────────────

type TabType = "feed" | "messages" | "music" | "news";

interface VocabChip {
  word: string;
  translation: string;
  context?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CulturalFeedScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{
    language: string;
    languageCode: string;
    level?: string;
  }>();

  const language = params.language || "Spanish";
  const languageCode = params.languageCode || "es-DO";
  const level = params.level || "A1";

  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedVocab, setExpandedVocab] = useState<string | null>(null);

  // tRPC queries
  const feedQuery = trpc.culturalIntel.getFeed.useQuery(
    { languageCode },
    { staleTime: 15 * 60 * 1000 }
  );

  const messagesQuery = trpc.culturalIntel.getAiFriendMessages.useQuery(
    { languageCode, learnerLevel: level },
    { staleTime: 30 * 60 * 1000 }
  );

  const refreshMutation = trpc.culturalIntel.refreshFeed.useMutation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await refreshMutation.mutateAsync({ languageCode });
      await feedQuery.refetch();
      await messagesQuery.refetch();
    } catch {}
    setRefreshing(false);
  }, [languageCode]);

  // ─── Tab Bar ────────────────────────────────────────────────────────────

  const tabs: Array<{ key: TabType; label: string; icon: string }> = [
    { key: "feed", label: "Feed", icon: "🌍" },
    { key: "messages", label: "Messages", icon: "💬" },
    { key: "music", label: "Music", icon: "🎵" },
    { key: "news", label: "News", icon: "📰" },
  ];

  // ─── Render Feed Item ──────────────────────────────────────────────────

  const renderFeedItem = useCallback((item: any, index: number) => {
    const typeIcons: Record<string, string> = {
      trending_music: "🎵",
      news: "📰",
      viral_content: "🔥",
      cultural_moment: "🌍",
      history: "📜",
      slang_alert: "🗣️",
    };

    const urgencyColors: Record<string, string> = {
      breaking: "#EF4444",
      trending: "#F59E0B",
      evergreen: "#10B981",
    };

    const isExpanded = expandedVocab === item.id;

    return (
      <Animated.View
        key={item.id || index}
        entering={FadeInDown.delay(index * 80).duration(300)}
        style={[styles.feedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {/* Header */}
        <View style={styles.feedCardHeader}>
          <Text style={styles.feedTypeIcon}>{typeIcons[item.type] || "🌍"}</Text>
          <View style={styles.feedCardHeaderText}>
            <Text style={[styles.feedCardTitle, { color: colors.foreground }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.feedCardMeta}>
              <View style={[styles.urgencyBadge, { backgroundColor: urgencyColors[item.urgency] || "#9BA1A6" }]}>
                <Text style={styles.urgencyText}>{item.urgency?.toUpperCase()}</Text>
              </View>
              <Text style={[styles.feedSource, { color: colors.muted }]}>{item.source}</Text>
            </View>
          </View>
          {item.relevanceScore >= 80 && (
            <View style={styles.hotBadge}>
              <Text style={styles.hotBadgeText}>HOT</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <Text style={[styles.feedCardBody, { color: colors.muted }]}>{item.body}</Text>

        {/* Cultural Context */}
        {item.culturalContext ? (
          <View style={[styles.contextBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.contextLabel, { color: colors.primary }]}>Cultural Context</Text>
            <Text style={[styles.contextText, { color: colors.foreground }]}>{item.culturalContext}</Text>
          </View>
        ) : null}

        {/* Vocabulary Chips */}
        {item.vocabulary?.length > 0 && (
          <Pressable
            onPress={() => {
              setExpandedVocab(isExpanded ? null : item.id);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <View style={styles.vocabSection}>
              <Text style={[styles.vocabLabel, { color: colors.primary }]}>
                📚 {item.vocabulary.length} words to learn {isExpanded ? "▲" : "▼"}
              </Text>
              {isExpanded && (
                <View style={styles.vocabChips}>
                  {item.vocabulary.map((v: VocabChip, i: number) => (
                    <View key={i} style={[styles.vocabChip, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
                      <Text style={[styles.vocabWord, { color: colors.primary }]}>{v.word}</Text>
                      <Text style={[styles.vocabTranslation, { color: colors.foreground }]}>{v.translation}</Text>
                      {v.context && <Text style={[styles.vocabContext, { color: colors.muted }]}>{v.context}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Pressable>
        )}

        {/* AI Friend Message Preview */}
        {item.friendMessage ? (
          <View style={[styles.friendMsgPreview, { backgroundColor: colors.primary + "10" }]}>
            <Text style={[styles.friendMsgText, { color: colors.foreground }]} numberOfLines={2}>
              💬 {item.friendMessage}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    );
  }, [colors, expandedVocab]);

  // ─── Render AI Friend Message ──────────────────────────────────────────

  const renderMessage = useCallback((msg: any, index: number) => {
    const categoryColors: Record<string, string> = {
      music: "#8B5CF6",
      news: "#3B82F6",
      culture: "#10B981",
      slang: "#EF4444",
      history: "#F59E0B",
    };

    return (
      <Animated.View
        key={msg.id || index}
        entering={SlideInRight.delay(index * 100).duration(300)}
        style={styles.messageRow}
      >
        {/* Avatar */}
        <View style={[styles.msgAvatar, { backgroundColor: categoryColors[msg.category] || colors.primary }]}>
          <Text style={styles.msgAvatarText}>{msg.senderEmoji || "🌍"}</Text>
        </View>

        {/* Bubble */}
        <View style={[styles.msgBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.msgHeader}>
            <Text style={[styles.msgSender, { color: colors.foreground }]}>{msg.senderName}</Text>
            <View style={[styles.msgCategoryBadge, { backgroundColor: categoryColors[msg.category] || colors.muted }]}>
              <Text style={styles.msgCategoryText}>{msg.category}</Text>
            </View>
          </View>
          <Text style={[styles.msgText, { color: colors.foreground }]}>{msg.message}</Text>

          {/* Related Vocab */}
          {msg.relatedVocab?.length > 0 && (
            <View style={styles.msgVocab}>
              {msg.relatedVocab.map((v: any, i: number) => (
                <Text key={i} style={[styles.msgVocabItem, { color: colors.primary }]}>
                  {v.word} → {v.meaning}
                </Text>
              ))}
            </View>
          )}

          {/* Action Button */}
          {msg.actionLabel && (
            <Pressable
              onPress={() => {
                if (msg.actionRoute) router.push(msg.actionRoute as any);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [
                styles.msgAction,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={styles.msgActionText}>{msg.actionLabel}</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    );
  }, [colors]);

  // ─── Filtered Items ────────────────────────────────────────────────────

  const feedItems = feedQuery.data?.items || [];
  const musicItems = feedItems.filter(i => i.type === "trending_music");
  const newsItems = feedItems.filter(i => i.type === "news");
  const messages = messagesQuery.data?.messages || [];

  // ─── Loading State ─────────────────────────────────────────────────────

  const isLoading = feedQuery.isLoading || messagesQuery.isLoading;

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>← Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Cultural Feed</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{language}</Text>
        </View>
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.refreshIcon}>🔄</Text>
        </Pressable>
      </View>

      {/* AI Greeting */}
      {feedQuery.data?.aiGreeting && (
        <Animated.View entering={FadeIn.duration(400)} style={[styles.greetingBanner, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.greetingText, { color: colors.primary }]}>{feedQuery.data.aiGreeting}</Text>
        </Animated.View>
      )}

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {tabs.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => {
              setActiveTab(tab.key);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={({ pressed }) => [
              styles.tab,
              activeTab === tab.key && [styles.tabActive, { borderBottomColor: colors.primary }],
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? colors.primary : colors.muted }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Fetching cultural updates...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Daily Fact */}
          {activeTab === "feed" && feedQuery.data?.dailyFact && (
            <Animated.View entering={FadeInUp.duration(300)} style={[styles.dailyFact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.dailyFactIcon}>💡</Text>
              <View style={styles.dailyFactContent}>
                <Text style={[styles.dailyFactLabel, { color: colors.primary }]}>Did You Know?</Text>
                <Text style={[styles.dailyFactText, { color: colors.foreground }]}>{feedQuery.data.dailyFact}</Text>
              </View>
            </Animated.View>
          )}

          {/* Feed Tab */}
          {activeTab === "feed" && feedItems.map((item, idx) => renderFeedItem(item, idx))}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <View style={styles.messagesContainer}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Messages from your AI friend
              </Text>
              {messages.length > 0 ? (
                messages.map((msg, idx) => renderMessage(msg, idx))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💬</Text>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    No messages yet. Check back soon!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Music Tab */}
          {activeTab === "music" && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                🎵 Trending Music
              </Text>
              {musicItems.length > 0 ? (
                musicItems.map((item, idx) => renderFeedItem(item, idx))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🎵</Text>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    No music trends available. Pull to refresh!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* News Tab */}
          {activeTab === "news" && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                📰 News & Current Events
              </Text>
              {newsItems.length > 0 ? (
                newsItems.map((item, idx) => renderFeedItem(item, idx))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📰</Text>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    No news available. Pull to refresh!
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 16, fontWeight: "600" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  refreshBtn: { padding: 4 },
  refreshIcon: { fontSize: 20 },

  greetingBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
  },
  greetingText: { fontSize: 14, fontWeight: "500", textAlign: "center" },

  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomWidth: 2 },
  tabIcon: { fontSize: 16 },
  tabLabel: { fontSize: 12, fontWeight: "600" },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14 },

  scrollContent: { padding: 16, gap: 12 },

  // Daily Fact
  dailyFact: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    alignItems: "flex-start",
  },
  dailyFactIcon: { fontSize: 24 },
  dailyFactContent: { flex: 1 },
  dailyFactLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  dailyFactText: { fontSize: 13, lineHeight: 19 },

  // Feed Card
  feedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  feedCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  feedTypeIcon: { fontSize: 28, marginTop: 2 },
  feedCardHeaderText: { flex: 1 },
  feedCardTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  feedCardMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgencyText: { fontSize: 9, fontWeight: "800", color: "#FFF" },
  feedSource: { fontSize: 11 },
  hotBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hotBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFF" },
  feedCardBody: { fontSize: 13, lineHeight: 19 },

  // Context Box
  contextBox: {
    padding: 10,
    borderRadius: 10,
  },
  contextLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  contextText: { fontSize: 12, lineHeight: 18 },

  // Vocabulary
  vocabSection: { gap: 6 },
  vocabLabel: { fontSize: 12, fontWeight: "700" },
  vocabChips: { gap: 6 },
  vocabChip: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  vocabWord: { fontSize: 14, fontWeight: "700" },
  vocabTranslation: { fontSize: 12, marginTop: 2 },
  vocabContext: { fontSize: 11, marginTop: 2, fontStyle: "italic" },

  // Friend Message Preview
  friendMsgPreview: {
    padding: 10,
    borderRadius: 10,
  },
  friendMsgText: { fontSize: 12, lineHeight: 18 },

  // Messages
  messagesContainer: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  messageRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  msgAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  msgAvatarText: { fontSize: 20 },
  msgBubble: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  msgHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  msgSender: { fontSize: 14, fontWeight: "700" },
  msgCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  msgCategoryText: { fontSize: 9, fontWeight: "700", color: "#FFF", textTransform: "uppercase" },
  msgText: { fontSize: 13, lineHeight: 19 },
  msgVocab: { gap: 2, marginTop: 4 },
  msgVocabItem: { fontSize: 12, fontWeight: "600" },
  msgAction: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  msgActionText: { color: "#FFF", fontSize: 12, fontWeight: "700" },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
