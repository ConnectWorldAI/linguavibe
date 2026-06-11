import React, { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import {
  getChatMedia,
  getStarredMessages,
  generateSampleMedia,
  saveChatMedia,
  type ChatMediaData,
  type StarredMessage,
  type SharedPhoto,
  type SharedLink,
  type SharedDocument,
} from "@/lib/chat-media-store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_SIZE = (SCREEN_WIDTH - 40 - 8) / 3; // 3 columns with gaps

// ─── TYPES ───────────────────────────────────────────────────────────────────
type MediaTab = "info" | "backgrounds" | "photos" | "links" | "documents";

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function ChatContactInfoScreen() {
  const params = useLocalSearchParams<{
    contactId?: string;
    contactName?: string;
    contactAvatar?: string;
    contactType?: string;
    contactLanguage?: string;
  }>();

  const contactId = params.contactId || "unknown";
  const contactName = params.contactName || "Contact";
  const contactAvatar = params.contactAvatar || "\u{1F464}";
  const contactType = params.contactType || "friend";
  const contactLanguage = params.contactLanguage || "English";

  const [activeTab, setActiveTab] = useState<MediaTab>("info");
  const [hideAlerts, setHideAlerts] = useState(false);
  const [sendReadReceipts, setSendReadReceipts] = useState(true);

  // Load persisted read receipts setting for this contact
  useEffect(() => {
    const loadReadReceiptsSetting = async () => {
      try {
        const stored = await AsyncStorage.getItem(`readReceipts_${contactId}`);
        if (stored !== null) {
          setSendReadReceipts(stored === "true");
        }
      } catch (e) { /* ignore */ }
    };
    loadReadReceiptsSetting();
  }, [contactId]);

  const handleReadReceiptsToggle = useCallback(async (value: boolean) => {
    setSendReadReceipts(value);
    try {
      await AsyncStorage.setItem(`readReceipts_${contactId}`, String(value));
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) { /* ignore */ }
  }, [contactId]);
  const [showInShared, setShowInShared] = useState(true);
  const [shareFocusStatus, setShareFocusStatus] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [lockChat, setLockChat] = useState(false);

  // Real media data
  const [mediaData, setMediaData] = useState<ChatMediaData | null>(null);
  const [starredMessages, setStarredMessages] = useState<StarredMessage[]>([]);

  useEffect(() => {
    loadMediaData();
  }, [contactId]);

  const loadMediaData = async () => {
    let data = await getChatMedia(contactId);
    // If no data exists, seed with sample data for demo
    if (data.photos.length === 0 && data.links.length === 0 && data.documents.length === 0) {
      data = generateSampleMedia(contactId);
      await saveChatMedia(contactId, data);
    }
    setMediaData(data);
    const starred = await getStarredMessages(contactId);
    setStarredMessages(starred);
  };

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const TABS: { key: MediaTab; label: string }[] = [
    { key: "info", label: "Info" },
    { key: "backgrounds", label: "Backgrounds" },
    { key: "photos", label: "Photos" },
    { key: "links", label: "Links" },
    { key: "documents", label: "Documents" },
  ];

  const mediaCount = mediaData
    ? mediaData.photos.length + mediaData.links.length + mediaData.documents.length
    : 0;
  const storageSize = mediaData
    ? `${((mediaData.photos.length * 0.5 + mediaData.documents.length * 1.2 + mediaData.audio.length * 0.3) || 0).toFixed(1)} MB`
    : "0 MB";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact info</Text>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{contactAvatar}</Text>
          </View>
          <Text style={styles.contactName}>{contactName}</Text>
          <Text style={styles.contactSubtitle}>
            {contactType === "instructor" ? "Language Instructor" : contactType === "classmate" ? "Classmate" : "Friend"} \u2022 {contactLanguage}
          </Text>
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={haptic}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="call" size={22} color={Colors.secondary} />
              </View>
              <Text style={styles.quickActionLabel}>Audio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={haptic}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="videocam" size={22} color={Colors.secondary} />
              </View>
              <Text style={styles.quickActionLabel}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={haptic}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="search" size={22} color={Colors.secondary} />
              </View>
              <Text style={styles.quickActionLabel}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* iMessage-style Tab Bar */}
        <View style={styles.tabBarContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
                onPress={() => { haptic(); setActiveTab(tab.key); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        {activeTab === "info" && (
          <View style={styles.tabContent}>
            <View style={styles.settingsCard}>
              <View style={styles.settingsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabelSmall}>mobile</Text>
                  <Text style={styles.settingsValueLarge}>Language: {contactLanguage}</Text>
                </View>
                <TouchableOpacity style={styles.inlineActionBtn}>
                  <Ionicons name="call" size={18} color={Colors.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        {activeTab === "backgrounds" && renderBackgroundsTab()}
        {activeTab === "photos" && renderPhotosTab(mediaData?.photos || [])}
        {activeTab === "links" && renderLinksTab(mediaData?.links || [])}
        {activeTab === "documents" && renderDocumentsTab(mediaData?.documents || [])}

        {/* iMessage-style Toggle Settings */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <View style={styles.toggleRow}>
              <Text style={styles.settingsLabel}>Hide Alerts</Text>
              <Switch
                value={hideAlerts}
                onValueChange={setHideAlerts}
                trackColor={{ false: Colors.textMuted, true: Colors.success }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.settingsDivider} />
            <View style={styles.toggleRow}>
              <Text style={styles.settingsLabel}>Send Read Receipts</Text>
              <Switch
                value={sendReadReceipts}
                onValueChange={handleReadReceiptsToggle}
                trackColor={{ false: Colors.textMuted, true: Colors.success }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.settingsDivider} />
            <View style={styles.toggleRow}>
              <Text style={styles.settingsLabel}>Show in Shared with You</Text>
              <Switch
                value={showInShared}
                onValueChange={setShowInShared}
                trackColor={{ false: Colors.textMuted, true: Colors.success }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.settingsDivider} />
            <View style={styles.toggleRow}>
              <Text style={styles.settingsLabel}>Share Focus Status</Text>
              <Switch
                value={shareFocusStatus}
                onValueChange={setShareFocusStatus}
                trackColor={{ false: Colors.textMuted, true: Colors.success }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Automatically Translate */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <View style={styles.toggleRow}>
              <Text style={styles.settingsLabel}>Automatically Translate</Text>
              <Switch
                value={autoTranslate}
                onValueChange={setAutoTranslate}
                trackColor={{ false: Colors.textMuted, true: Colors.success }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* WhatsApp-style Media/Storage/Starred Section */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7} onPress={() => { haptic(); setActiveTab("photos"); }}>
              <Ionicons name="images" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Media, links and docs</Text>
              <Text style={styles.settingsValue}>{mediaCount > 0 ? `${mediaCount}` : "None"}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="server" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Manage storage</Text>
              <Text style={styles.settingsValue}>{storageSize}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.7}
              onPress={() => {
                haptic();
                router.push({
                  pathname: "/starred-messages",
                  params: { contactId, contactName, contactAvatar },
                } as any);
              }}
            >
              <Ionicons name="star-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Starred</Text>
              <Text style={styles.settingsValue}>{starredMessages.length}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications / Chat Theme / Save to Photos */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Notifications</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.7}
              onPress={() => {
                haptic();
                router.push({
                  pathname: "/chat-theme-picker",
                  params: { contactId, contactName },
                } as any);
              }}
            >
              <Ionicons name="color-palette-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Chat theme</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="download-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Save to Photos</Text>
              <Text style={styles.settingsValue}>Default</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Disappearing Messages / Transcript Language / Lock Chat / Advanced Privacy / Encryption */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7} onPress={() => router.push({ pathname: "/disappearing-messages", params: { contactId, contactName } } as any)}>
              <Ionicons name="timer-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Disappearing messages</Text>
              <Text style={styles.settingsValue}>Off</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsLabel}>Transcript language</Text>
                <Text style={styles.settingsSubLabel}>{contactLanguage}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <View style={styles.toggleRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
                <View>
                  <Text style={styles.settingsLabel}>Lock chat</Text>
                  <Text style={styles.settingsSubLabel}>Lock and hide this chat on this device.</Text>
                </View>
              </View>
              <Switch
                value={lockChat}
                onValueChange={setLockChat}
                trackColor={{ false: Colors.textMuted, true: Colors.success }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="shield-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Advanced chat privacy</Text>
              <Text style={styles.settingsValue}>Off</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="lock-closed" size={20} color={Colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsLabel}>Encryption</Text>
                <Text style={styles.settingsSubLabel}>Messages and calls are end-to-end encrypted. Tap to verify.</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Details */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Ionicons name="person-circle-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.settingsLabel}>Contact details</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Groups Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionHeader}>No groups in common</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7} onPress={() => router.push({ pathname: "/create-group-chat", params: { contactId, contactName } } as any)}>
              <View style={styles.addIcon}>
                <Ionicons name="add" size={18} color={Colors.secondary} />
              </View>
              <Text style={styles.settingsLabel}>Create group with {contactName.split(" ")[0]}</Text>
              <View style={{ flex: 1 }} />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <View style={styles.addIcon}>
                <Ionicons name="people" size={16} color={Colors.secondary} />
              </View>
              <Text style={styles.settingsLabel}>Add to group</Text>
              <View style={{ flex: 1 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons (Green) */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Text style={styles.actionTextGreen}>Share contact</Text>
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Text style={styles.actionTextGreen}>Add to Favorites</Text>
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Text style={styles.actionTextGreen}>Add to list</Text>
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Text style={styles.actionTextGreen}>Export chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Destructive Actions (Red) */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Text style={styles.actionTextRed}>Clear chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Text style={styles.actionTextRed}>Block {contactName}</Text>
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Text style={styles.actionTextRed}>Report {contactName}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* iMessage footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            All messages are securely encrypted end-to-end, so they can't be read while they're sent between devices.
          </Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Learn more...</Text>
          </TouchableOpacity>
        </View>

        {/* Show in Contacts / Download Attachments */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Text style={styles.actionTextBlue}>Show in Contacts</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Text style={styles.actionTextBlue}>Download Attachments in Cloud</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Turn On Contact Key Verification */}
        <View style={[styles.settingsSection, { marginBottom: 60 }]}>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Text style={styles.actionTextBlue}>Turn On Contact Key Verification</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── TAB RENDERERS ──────────────────────────────────────────────────────────

function renderBackgroundsTab() {
  return (
    <View style={styles.tabContent}>
      <View style={styles.emptyTabState}>
        <Ionicons name="color-palette-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyTabTitle}>No Custom Backgrounds</Text>
        <Text style={styles.emptyTabSub}>Chat backgrounds you set will appear here</Text>
      </View>
    </View>
  );
}

function renderPhotosTab(photos: SharedPhoto[]) {
  if (photos.length === 0) {
    return (
      <View style={styles.tabContent}>
        <View style={styles.emptyTabState}>
          <Ionicons name="images-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTabTitle}>No Photos</Text>
          <Text style={styles.emptyTabSub}>Photos shared in this conversation will appear here</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.tabContent}>
      <View style={styles.photoGrid}>
        {photos.map((photo) => (
          <View key={photo.id} style={styles.photoItem}>
            <Image source={{ uri: photo.uri }} style={styles.photoImage} />
            <View style={styles.photoOverlay}>
              <Text style={styles.photoDate}>
                {new Date(photo.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function renderLinksTab(links: SharedLink[]) {
  if (links.length === 0) {
    return (
      <View style={styles.tabContent}>
        <View style={styles.emptyTabState}>
          <Ionicons name="link-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTabTitle}>No Links</Text>
          <Text style={styles.emptyTabSub}>Links shared in this conversation will appear here</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.tabContent}>
      {links.map((link) => (
        <TouchableOpacity key={link.id} style={styles.linkItem} activeOpacity={0.7}>
          <View style={styles.linkIconWrap}>
            <Ionicons name="globe-outline" size={20} color={Colors.secondary} />
          </View>
          <View style={styles.linkInfo}>
            <Text style={styles.linkTitle} numberOfLines={1}>{link.title}</Text>
            <Text style={styles.linkDomain} numberOfLines={1}>{link.domain}</Text>
            <Text style={styles.linkDate}>
              {new Date(link.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </Text>
          </View>
          <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function renderDocumentsTab(documents: SharedDocument[]) {
  if (documents.length === 0) {
    return (
      <View style={styles.tabContent}>
        <View style={styles.emptyTabState}>
          <Ionicons name="document-text-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTabTitle}>No Documents</Text>
          <Text style={styles.emptyTabSub}>Documents shared in this conversation will appear here</Text>
        </View>
      </View>
    );
  }
  const getDocIcon = (type: string) => {
    switch (type) {
      case "pdf": return "document-text";
      case "doc": case "docx": return "document";
      case "xls": case "xlsx": return "grid";
      default: return "document-outline";
    }
  };
  const getDocColor = (type: string) => {
    switch (type) {
      case "pdf": return Colors.accent;
      case "doc": case "docx": return Colors.secondary;
      case "xls": case "xlsx": return Colors.success;
      default: return Colors.textSecondary;
    }
  };
  return (
    <View style={styles.tabContent}>
      {documents.map((doc) => (
        <TouchableOpacity key={doc.id} style={styles.docItem} activeOpacity={0.7}>
          <View style={[styles.docIconWrap, { backgroundColor: getDocColor(doc.type) + "20" }]}>
            <Ionicons name={getDocIcon(doc.type) as any} size={20} color={getDocColor(doc.type)} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
            <Text style={styles.docMeta}>{doc.size} \u2022 {doc.type.toUpperCase()}</Text>
            <Text style={styles.docDate}>
              {new Date(doc.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </Text>
          </View>
          <Ionicons name="download-outline" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.secondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Hero
  heroSection: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 20,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.glowBorder,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
  },
  contactName: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  quickActions: {
    flexDirection: "row",
    gap: 32,
    marginTop: 16,
  },
  quickActionBtn: {
    alignItems: "center",
    gap: 6,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  // Tab Bar
  tabBarContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    marginTop: 8,
  },
  tabBarScroll: {
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: Colors.secondary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.secondary,
  },
  // Tab Content
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyTabState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTabTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptyTabSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  // Photos Grid
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.surfaceCard,
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  photoDate: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "600",
  },
  // Links
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  linkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  linkDomain: {
    fontSize: 12,
    color: Colors.secondary,
    marginBottom: 2,
  },
  linkDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  // Documents
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  docIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  docMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  docDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  // Settings
  settingsSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  settingsCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  settingsLabelSmall: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  settingsValueLarge: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  settingsSubLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingsValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  settingsDivider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginLeft: 48,
  },
  inlineActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  // Action rows
  actionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionTextGreen: {
    fontSize: 15,
    color: Colors.success,
    fontWeight: "500",
  },
  actionTextRed: {
    fontSize: 15,
    color: Colors.accent,
    fontWeight: "500",
  },
  actionTextBlue: {
    fontSize: 15,
    color: Colors.secondary,
    fontWeight: "500",
  },
  // Footer
  footerSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  footerLink: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 4,
  },
});
