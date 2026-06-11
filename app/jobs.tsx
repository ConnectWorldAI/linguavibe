import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────

type JobAlert = {
  id: string;
  title: string;
  location: string;
  frequency: "Daily" | "Weekly" | "Instant";
  languagePair: string;
  enabled: boolean;
};

type JobCollection = {
  id: string;
  label: string;
  icon: string;
  count: number;
  color: string;
  weeklyDigest: boolean;
};

type JobNotification = {
  id: string;
  type: "job_digest" | "mention" | "post_engagement" | "certification";
  title: string;
  subtitle: string;
  timestamp: string;
  icon: string;
  iconColor: string;
  actionLabel?: string;
};

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_ALERTS: JobAlert[] = [
  {
    id: "1",
    title: "Bilingual Customer Success",
    location: "Remote — Worldwide",
    frequency: "Daily",
    languagePair: "Spanish + English",
    enabled: true,
  },
  {
    id: "2",
    title: "AI Language Trainer",
    location: "San Francisco, CA",
    frequency: "Instant",
    languagePair: "French + English",
    enabled: true,
  },
  {
    id: "3",
    title: "Translation QA Specialist",
    location: "Remote — EU Timezone",
    frequency: "Weekly",
    languagePair: "German + English",
    enabled: false,
  },
  {
    id: "4",
    title: "Multilingual Content Moderator",
    location: "Remote — LATAM",
    frequency: "Daily",
    languagePair: "Portuguese + Spanish",
    enabled: true,
  },
];

const MOCK_COLLECTIONS: JobCollection[] = [
  { id: "remote", label: "Remote", icon: "globe-outline", count: 142, color: Colors.secondary, weeklyDigest: true },
  { id: "bilingual", label: "Bilingual", icon: "language-outline", count: 89, color: Colors.gold, weeklyDigest: true },
  { id: "easy-apply", label: "Easy Apply", icon: "flash-outline", count: 56, color: Colors.success, weeklyDigest: false },
  { id: "it", label: "IT & Tech", icon: "code-slash-outline", count: 203, color: "#A855F7", weeklyDigest: false },
  { id: "healthcare", label: "Healthcare", icon: "medkit-outline", count: 34, color: "#EC4899", weeklyDigest: true },
  { id: "education", label: "Education", icon: "school-outline", count: 67, color: "#14B8A6", weeklyDigest: false },
];

const MOCK_NOTIFICATIONS: JobNotification[] = [
  {
    id: "n1",
    type: "job_digest",
    title: "12 new bilingual remote roles",
    subtitle: "Based on your Spanish + English certification",
    timestamp: "2h ago",
    icon: "briefcase",
    iconColor: Colors.secondary,
    actionLabel: "View jobs",
  },
  {
    id: "n2",
    type: "certification",
    title: "Your B2 Spanish cert is trending",
    subtitle: "47 employers viewed your profile this week",
    timestamp: "5h ago",
    icon: "ribbon",
    iconColor: Colors.gold,
  },
  {
    id: "n3",
    type: "job_digest",
    title: "AI Trainer roles at OpenAI, Anthropic",
    subtitle: "3 positions match your language skills",
    timestamp: "1d ago",
    icon: "sparkles",
    iconColor: "#A855F7",
    actionLabel: "View jobs",
  },
  {
    id: "n4",
    type: "post_engagement",
    title: "Your cover of 'Despacito' got 23 views from recruiters",
    subtitle: "Recruiters from Duolingo and Babbel viewed your profile",
    timestamp: "2d ago",
    icon: "eye",
    iconColor: Colors.success,
  },
  {
    id: "n5",
    type: "mention",
    title: "Maria G. mentioned you in a recommendation",
    subtitle: '"Excellent pronunciation and cultural awareness..."',
    timestamp: "3d ago",
    icon: "chatbubble-ellipses",
    iconColor: Colors.secondary,
  },
  {
    id: "n6",
    type: "job_digest",
    title: "Healthcare interpreter roles in Miami",
    subtitle: "5 new positions matching your profile",
    timestamp: "4d ago",
    icon: "medkit",
    iconColor: "#EC4899",
    actionLabel: "View jobs",
  },
];

const NOTIFICATION_TABS = ["All", "Jobs", "My posts", "Mentions"] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export default function JobsScreen() {
  const router = useRouter();
  const [openToWork, setOpenToWork] = useState(true);
  const [aiTrainerAlerts, setAiTrainerAlerts] = useState(true);
  const [topJobPicks, setTopJobPicks] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof NOTIFICATION_TABS[number]>("All");
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [collections, setCollections] = useState(MOCK_COLLECTIONS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  // Load saved job preferences from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@job_preferences');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.alerts) setAlerts(data.alerts);
          if (data.collections) setCollections(data.collections);
          if (data.notifications) setNotifications(data.notifications);
          if (data.openToWork !== undefined) setOpenToWork(data.openToWork);
        }
      } catch {}
    })();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    AsyncStorage.setItem('@job_preferences', JSON.stringify({ alerts, collections, openToWork })).catch(() => {});
  }, [alerts, collections, openToWork]);

  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  }, []);

  const toggleCollectionDigest = useCallback((id: string) => {
    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, weeklyDigest: !c.weeklyDigest } : c))
    );
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "All") return true;
    if (activeTab === "Jobs") return n.type === "job_digest";
    if (activeTab === "My posts") return n.type === "post_engagement";
    if (activeTab === "Mentions") return n.type === "mention" || n.type === "certification";
    return true;
  });

  // ─── Render Sections ────────────────────────────────────────────────────────

  const renderPreferences = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>JOB PREFERENCES</Text>

      {/* Open to Work Toggle */}
      <View style={styles.preferenceCard}>
        <View style={styles.prefRow}>
          <View style={styles.prefLeft}>
            <View style={[styles.prefIcon, { backgroundColor: "rgba(0, 255, 136, 0.12)" }]}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            </View>
            <View style={styles.prefTextBlock}>
              <Text style={styles.prefLabel}>Open to Work</Text>
              <Text style={styles.prefSub}>Visible to employers on ConnectWorld AI</Text>
            </View>
          </View>
          <Switch
            value={openToWork}
            onValueChange={setOpenToWork}
            trackColor={{ false: Colors.surfaceCard, true: "rgba(0, 255, 136, 0.35)" }}
            thumbColor={openToWork ? Colors.success : Colors.textMuted}
          />
        </View>
      </View>

      {/* Preference Rows */}
      <View style={styles.prefList}>
        <Pressable style={({ pressed }) => [styles.prefRowItem, pressed && styles.pressed]}>
          <View style={styles.prefRowLeft}>
            <Ionicons name="notifications-outline" size={18} color={Colors.secondary} />
            <Text style={styles.prefRowLabel}>Job alerts by language pair</Text>
          </View>
          <View style={styles.prefRowRight}>
            <Text style={styles.prefRowValue}>4 active</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </View>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.prefRowItem, pressed && styles.pressed]}>
          <View style={styles.prefRowLeft}>
            <Ionicons name="sparkles-outline" size={18} color="#A855F7" />
            <View style={styles.prefRowTextBlock}>
              <Text style={styles.prefRowLabel}>AI Trainer project alerts</Text>
              <Text style={styles.prefRowSub}>Get notified about AI training opportunities</Text>
            </View>
          </View>
          <Switch
            value={aiTrainerAlerts}
            onValueChange={setAiTrainerAlerts}
            trackColor={{ false: Colors.surfaceCard, true: "rgba(168, 85, 247, 0.35)" }}
            thumbColor={aiTrainerAlerts ? "#A855F7" : Colors.textMuted}
          />
        </Pressable>

        <Pressable style={({ pressed }) => [styles.prefRowItem, pressed && styles.pressed]}>
          <View style={styles.prefRowLeft}>
            <Ionicons name="cash-outline" size={18} color={Colors.gold} />
            <Text style={styles.prefRowLabel}>Desired pay</Text>
          </View>
          <View style={styles.prefRowRight}>
            <Text style={[styles.prefRowValue, { color: Colors.textMuted }]}>Private</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </View>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.prefRowItem, pressed && styles.pressed]}>
          <View style={styles.prefRowLeft}>
            <Ionicons name="ribbon-outline" size={18} color={Colors.gold} />
            <Text style={styles.prefRowLabel}>My qualifications</Text>
          </View>
          <View style={styles.prefRowRight}>
            <Text style={styles.prefRowValue}>2 certs + resume</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </View>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.prefRowItem, pressed && styles.pressed]}>
          <View style={styles.prefRowLeft}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.secondary} />
            <Text style={styles.prefRowLabel}>My verifications</Text>
          </View>
          <View style={styles.prefRowRight}>
            <Text style={styles.prefRowValue}>Verified</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </View>
        </Pressable>
      </View>
    </View>
  );

  const renderAlerts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>MANAGE JOB ALERTS</Text>
        <Pressable style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="add-circle-outline" size={18} color={Colors.secondary} />
          <Text style={styles.addBtnText}>New Alert</Text>
        </Pressable>
      </View>

      {alerts.map((alert) => (
        <View key={alert.id} style={styles.alertCard}>
          <View style={styles.alertTop}>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <View style={styles.alertMeta}>
                <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.alertMetaText}>{alert.location}</Text>
              </View>
              <View style={styles.alertTags}>
                <View style={[styles.alertTag, { borderColor: Colors.goldBorder }]}>
                  <Text style={[styles.alertTagText, { color: Colors.gold }]}>{alert.languagePair}</Text>
                </View>
                <View style={[styles.alertTag, { borderColor: Colors.glowBorder }]}>
                  <Text style={[styles.alertTagText, { color: Colors.secondary }]}>{alert.frequency}</Text>
                </View>
              </View>
            </View>
            <Switch
              value={alert.enabled}
              onValueChange={() => toggleAlert(alert.id)}
              trackColor={{ false: Colors.surfaceCard, true: "rgba(0, 170, 255, 0.35)" }}
              thumbColor={alert.enabled ? Colors.secondary : Colors.textMuted}
            />
          </View>
          <View style={styles.alertActions}>
            <Pressable style={({ pressed }) => [styles.alertActionBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="create-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.alertActionText}>Edit</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.alertActionBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="trash-outline" size={14} color={Colors.accent} />
              <Text style={[styles.alertActionText, { color: Colors.accent }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );

  const renderCollections = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>JOB COLLECTIONS</Text>
      <View style={styles.collectionsGrid}>
        {collections.map((col) => (
          <Pressable
            key={col.id}
            style={({ pressed }) => [styles.collectionCard, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.collectionTop}>
              <View style={[styles.collectionIcon, { backgroundColor: `${col.color}18` }]}>
                <Ionicons name={col.icon as any} size={20} color={col.color} />
              </View>
              <Text style={[styles.collectionCount, { color: col.color }]}>{col.count}</Text>
            </View>
            <Text style={styles.collectionLabel}>{col.label}</Text>
            <View style={styles.collectionDigest}>
              <Text style={styles.collectionDigestLabel}>Weekly digest</Text>
              <Switch
                value={col.weeklyDigest}
                onValueChange={() => toggleCollectionDigest(col.id)}
                trackColor={{ false: Colors.surfaceCard, true: `${col.color}55` }}
                thumbColor={col.weeklyDigest ? col.color : Colors.textMuted}
                style={styles.smallSwitch}
              />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderTopPicks = () => (
    <View style={styles.section}>
      <View style={styles.topPicksCard}>
        <View style={styles.prefRow}>
          <View style={styles.prefLeft}>
            <View style={[styles.prefIcon, { backgroundColor: Colors.goldGlow }]}>
              <Ionicons name="diamond" size={20} color={Colors.gold} />
            </View>
            <View style={styles.prefTextBlock}>
              <Text style={styles.prefLabel}>Top Job Picks</Text>
              <Text style={styles.prefSub}>AI recommends based on your certified languages</Text>
            </View>
          </View>
          <Switch
            value={topJobPicks}
            onValueChange={setTopJobPicks}
            trackColor={{ false: Colors.surfaceCard, true: Colors.goldBorder }}
            thumbColor={topJobPicks ? Colors.gold : Colors.textMuted}
          />
        </View>
        {topJobPicks && (
          <View style={styles.topPicksInfo}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.topPicksInfoText}>
              We'll match you with roles based on your B2 Spanish, B1 French certifications and voice proficiency scores.
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderNotificationTabs = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
      <View style={styles.tabRow}>
        {NOTIFICATION_TABS.map((tab) => (
          <Pressable
            key={tab}
            style={({ pressed }) => [
              styles.tab,
              activeTab === tab && styles.tabActive,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderNotification = ({ item }: { item: JobNotification }) => (
    <View style={styles.notifCard}>
      <View style={[styles.notifIcon, { backgroundColor: `${item.iconColor}18` }]}>
        <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
      </View>
      <View style={styles.notifContent}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifSubtitle}>{item.subtitle}</Text>
        <View style={styles.notifBottom}>
          <Text style={styles.notifTimestamp}>{item.timestamp}</Text>
          {item.actionLabel && (
            <Pressable style={({ pressed }) => [styles.notifAction, pressed && { opacity: 0.7 }]}>
              <Text style={styles.notifActionText}>{item.actionLabel}</Text>
              <Ionicons name="arrow-forward" size={12} color={Colors.secondary} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );

  // ─── Main Render ────────────────────────────────────────────────────────────

  const sections = [
    { key: "preferences", render: renderPreferences },
    { key: "alerts", render: renderAlerts },
    { key: "collections", render: renderCollections },
    { key: "topPicks", render: renderTopPicks },
    { key: "notifTabs", render: renderNotificationTabs },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Career & Opportunities</Text>
        <Pressable
          style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.push("/settings" as any)}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {sections.map((s) => (
              <View key={s.key}>{s.render()}</View>
            ))}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No notifications in this category</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerText}>Learn. Certify. Get Hired.</Text>
            <Text style={styles.footerSub}>ConnectWorld AI Career Network</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listContent: {
    paddingBottom: 120,
  },

  // ─── Sections ─────────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.secondary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },

  // ─── Preferences ─────────────────────────────────────────────────────────
  preferenceCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    marginBottom: Spacing.md,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prefLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  prefIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  prefTextBlock: {
    flex: 1,
  },
  prefLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  prefSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  prefList: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  prefRowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pressed: {
    backgroundColor: Colors.glowSubtle,
  },
  prefRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  prefRowTextBlock: {
    flex: 1,
  },
  prefRowLabel: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  prefRowSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  prefRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  prefRowValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // ─── Alerts ───────────────────────────────────────────────────────────────
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
  },
  addBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
  alertCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  alertTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  alertInfo: {
    flex: 1,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  alertMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  alertMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  alertTags: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  alertTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  alertTagText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  alertActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  alertActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  alertActionText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  // ─── Collections ──────────────────────────────────────────────────────────
  collectionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  collectionCard: {
    width: "47%" as any,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  collectionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  collectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  collectionCount: {
    fontSize: FontSize.lg,
    fontWeight: "700",
  },
  collectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  collectionDigest: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collectionDigestLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  smallSwitch: {
    transform: Platform.OS === "ios" ? [{ scaleX: 0.7 }, { scaleY: 0.7 }] : [],
  },

  // ─── Top Picks ────────────────────────────────────────────────────────────
  topPicksCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  topPicksInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  topPicksInfoText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },

  // ─── Notification Tabs ────────────────────────────────────────────────────
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: "rgba(0, 170, 255, 0.15)",
    borderColor: Colors.glowBorder,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.secondary,
    fontWeight: "600",
  },

  // ─── Notifications ────────────────────────────────────────────────────────
  notifCard: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 3,
    lineHeight: 20,
  },
  notifSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  notifBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifTimestamp: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  notifAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0, 170, 255, 0.10)",
  },
  notifActionText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.secondary,
  },

  // ─── Empty & Footer ───────────────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: 12,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: 4,
  },
  footerText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  footerSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
