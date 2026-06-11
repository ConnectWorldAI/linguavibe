import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Image,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../../constants/Colors";
import { useNotificationBadges } from "@/lib/notification-badges";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useI18n } from "@/lib/i18n";

const CONNECTME_LOGO = require("../../assets/images/connectworld-logo.png");

type SubTab = "recents" | "contacts" | "dialpad" | "voicemail" | "video";

type CallEntry = {
  id: string;
  name: string;
  avatar: string;
  flag: string;
  type: "missed" | "incoming" | "outgoing";
  time: string;
  duration?: string;
  language: string;
  isTeacher: boolean;
};

type Contact = {
  id: string;
  name: string;
  avatar: string;
  flag: string;
  language: string;
  isTeacher: boolean;
  isFavorite: boolean;
  isOnline: boolean;
};

type Voicemail = {
  id: string;
  from: string;
  avatar: string;
  flag: string;
  time: string;
  duration: string;
  isNew: boolean;
  transcription: string;
  translation: string;
};

type VideoEntry = {
  id: string;
  name: string;
  avatar: string;
  flag: string;
  type: "missed" | "incoming" | "outgoing";
  time: string;
  duration?: string;
};

const CALL_HISTORY: CallEntry[] = [
  { id: "1", name: "Prof. Carlos", avatar: "👨🏽‍🏫", flag: "🇩🇴", type: "missed", time: "10 min ago", language: "Dominican Spanish", isTeacher: true },
  { id: "2", name: "Marie Dubois", avatar: "👩🏻", flag: "🇫🇷", type: "missed", time: "25 min ago", language: "French", isTeacher: false },
  { id: "3", name: "Sensei Kenji", avatar: "👨🏻‍🏫", flag: "🇯🇵", type: "incoming", time: "2h ago", duration: "12:34", language: "Japanese", isTeacher: true },
  { id: "4", name: "Prof. Sofia", avatar: "👩🏽‍🏫", flag: "🇨🇴", type: "outgoing", time: "Yesterday", duration: "8:15", language: "Colombian Spanish", isTeacher: true },
  { id: "5", name: "Amara", avatar: "👩🏿", flag: "🇳🇬", type: "incoming", time: "Yesterday", duration: "5:42", language: "Yoruba", isTeacher: false },
  { id: "6", name: "Liam", avatar: "👨🏼", flag: "🇩🇪", type: "outgoing", time: "2 days ago", duration: "3:18", language: "German", isTeacher: false },
];

const CONTACTS: Contact[] = [
  { id: "1", name: "Prof. Carlos", avatar: "👨🏽‍🏫", flag: "🇩🇴", language: "Dominican Spanish", isTeacher: true, isFavorite: true, isOnline: true },
  { id: "2", name: "Sensei Kenji", avatar: "👨🏻‍🏫", flag: "🇯🇵", language: "Japanese", isTeacher: true, isFavorite: true, isOnline: true },
  { id: "3", name: "Prof. Sofia", avatar: "👩🏽‍🏫", flag: "🇨🇴", language: "Colombian Spanish", isTeacher: true, isFavorite: false, isOnline: true },
  { id: "4", name: "Marie Dubois", avatar: "👩🏻", flag: "🇫🇷", language: "French", isTeacher: false, isFavorite: true, isOnline: false },
  { id: "5", name: "Amara", avatar: "👩🏿", flag: "🇳🇬", language: "Yoruba", isTeacher: false, isFavorite: false, isOnline: true },
  { id: "6", name: "Liam", avatar: "👨🏼", flag: "🇩🇪", language: "German", isTeacher: false, isFavorite: false, isOnline: false },
  { id: "7", name: "Priya Sharma", avatar: "👩🏽", flag: "🇮🇳", language: "Hindi", isTeacher: false, isFavorite: false, isOnline: true },
  { id: "8", name: "Chen Wei", avatar: "👨🏻", flag: "🇨🇳", language: "Mandarin", isTeacher: false, isFavorite: false, isOnline: false },
];

const VOICEMAILS: Voicemail[] = [
  { id: "1", from: "Prof. Carlos", avatar: "👨🏽‍🏫", flag: "🇩🇴", time: "10 min ago", duration: "0:32", isNew: true, transcription: "Hola! Te llamé para recordarte de la clase de mañana a las 3pm.", translation: "Hi! I called to remind you about tomorrow's class at 3pm." },
  { id: "2", from: "Marie Dubois", avatar: "👩🏻", flag: "🇫🇷", time: "1h ago", duration: "0:18", isNew: true, transcription: "Salut! Tu veux pratiquer le français ce soir?", translation: "Hi! Do you want to practice French tonight?" },
  { id: "3", from: "Sensei Kenji", avatar: "👨🏻‍🏫", flag: "🇯🇵", time: "Yesterday", duration: "0:45", isNew: false, transcription: "お疲れ様です。明日のレッスンの準備をしてください。", translation: "Good work. Please prepare for tomorrow's lesson." },
];

const VIDEO_HISTORY: VideoEntry[] = [
  { id: "1", name: "Prof. Carlos", avatar: "👨🏽‍🏫", flag: "🇩🇴", type: "outgoing", time: "Today", duration: "15:22" },
  { id: "2", name: "Sensei Kenji", avatar: "👨🏻‍🏫", flag: "🇯🇵", type: "incoming", time: "Yesterday", duration: "22:10" },
  { id: "3", name: "Marie Dubois", avatar: "👩🏻", flag: "🇫🇷", type: "missed", time: "2 days ago" },
];

export default function CallsScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<SubTab>((params.tab as SubTab) || "recents");
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [dialNumber, setDialNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingVoicemail, setPlayingVoicemail] = useState<string | null>(null);
  const { clearBadge } = useNotificationBadges();

  // Twilio video call integration
  const createRoomMutation = trpc.videoCall.createRoom.useMutation();

  const initiateVideoCall = async (contactId: string, contactName: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Route to Hume AI voice call — the Hume hook handles audio capture + playback
    router.push({
      pathname: "/hume-call",
      params: {
        mode: "teacher",
        persona: "cloudwave",
        language: "Spanish",
        dialect: "Dominican",
        teacherName: contactName,
      },
    } as any);
  };

  const initiateVoiceCall = async (contactId: string, contactName: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Route to Hume AI voice call — the Hume hook handles audio capture + playback
    router.push({
      pathname: "/hume-call",
      params: {
        mode: "teacher",
        persona: "cloudwave",
        language: "Spanish",
        dialect: "Dominican",
        teacherName: contactName,
      },
    } as any);
  };

  // Clear calls badge when this tab is focused
  useFocusEffect(
    React.useCallback(() => {
      clearBadge("calls");
      // Also clear the AsyncStorage missed call counter
      AsyncStorage.setItem("@missed_calls_count", "0").catch(() => {});
    }, [clearBadge])
  );

  // Pulse glow animation for the logo call button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const missedCount = CALL_HISTORY.filter((c) => c.type === "missed").length;
  const newVoicemailCount = VOICEMAILS.filter((v) => v.isNew).length;

  const SUB_TABS: { key: SubTab; label: string; icon: string; badge?: number }[] = [
    { key: "recents", label: "Recents", icon: "time-outline" },
    { key: "contacts", label: "Contacts", icon: "people-outline" },
    { key: "dialpad", label: "Dialpad", icon: "keypad-outline" },
    { key: "voicemail", label: "Voicemail", icon: "recording-outline", badge: newVoicemailCount },
    { key: "video", label: "Video", icon: "videocam-outline" },
  ];

  const getCallIcon = (type: string) => {
    switch (type) {
      case "missed": return { name: "call-outline" as const, color: Colors.accent };
      case "incoming": return { name: "arrow-down-outline" as const, color: Colors.success };
      case "outgoing": return { name: "arrow-up-outline" as const, color: Colors.secondary };
      default: return { name: "call-outline" as const, color: Colors.textSecondary };
    }
  };

  const handleDial = (digit: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDialNumber((prev) => prev + digit);
  };

  const handleLongPressZero = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setDialNumber((prev) => prev + "+");
  };

  const handleDelete = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDialNumber((prev) => prev.slice(0, -1));
  };

  // ─── RECENTS TAB ───
  const renderRecents = () => {
    const filteredCalls = filter === "missed"
      ? CALL_HISTORY.filter((c) => c.type === "missed")
      : CALL_HISTORY;

    return (
      <View style={styles.tabContent}>
        {/* Filter */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === "all" && styles.filterBtnActive]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === "missed" && styles.filterBtnActive]}
            onPress={() => setFilter("missed")}
          >
            <Text style={[styles.filterText, filter === "missed" && styles.filterTextActive]}>
              Missed ({missedCount})
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredCalls}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            const callIcon = getCallIcon(item.type);
            return (
              <TouchableOpacity
                style={styles.callItem}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave" } } as any)}
              >
                <View style={[styles.avatarWrap, item.type === "missed" && styles.avatarMissed]}>
                  <Text style={styles.avatar}>{item.avatar}</Text>
                  <Text style={styles.flagBadge}>{item.flag}</Text>
                </View>
                <View style={styles.callContent}>
                  <Text style={[styles.callName, item.type === "missed" && { color: Colors.accent }]}>
                    {item.name}
                  </Text>
                  <View style={styles.callMeta}>
                    <Ionicons name={callIcon.name} size={14} color={callIcon.color} />
                    <Text style={styles.callTime}>{item.time}</Text>
                    {item.duration && <Text style={styles.callDuration}>{item.duration}</Text>}
                  </View>
                  <Text style={styles.callLang}>{item.language}</Text>
                </View>
                <View style={styles.callActions}>
                  <TouchableOpacity style={styles.callActionBtn} onPress={() => initiateVoiceCall(item.id, item.name)}>
                    <Ionicons name="call" size={16} color={Colors.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.callActionBtn} onPress={() => initiateVideoCall(item.id, item.name)}>
                    <Ionicons name="videocam" size={16} color={Colors.secondary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  // ─── CONTACTS TAB ───
  const renderContacts = () => {
    const filtered = searchQuery
      ? CONTACTS.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : CONTACTS;
    const favorites = filtered.filter((c) => c.isFavorite);
    const others = filtered.filter((c) => !c.isFavorite);

    return (
      <View style={styles.tabContent}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Favorites */}
          {favorites.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>FAVORITES</Text>
              {favorites.map((contact) => (
                <TouchableOpacity key={contact.id} style={styles.contactItem} activeOpacity={0.7}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>{contact.avatar}</Text>
                    {contact.isOnline && <View style={styles.onlineDot} />}
                    <Text style={styles.contactFlag}>{contact.flag}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactLang}>
                      {contact.isTeacher ? "🎓 " : ""}{contact.language}
                    </Text>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity style={styles.contactActionBtn} onPress={() => initiateVoiceCall(contact.id, contact.name)}>
                      <Ionicons name="call" size={16} color={Colors.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactActionBtn} onPress={() => initiateVideoCall(contact.id, contact.name)}>
                      <Ionicons name="videocam" size={16} color={Colors.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactActionBtn}>
                      <Ionicons name="chatbubble" size={16} color={Colors.secondary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* All Contacts */}
          <Text style={styles.sectionLabel}>ALL CONTACTS</Text>
          {others.map((contact) => (
            <TouchableOpacity key={contact.id} style={styles.contactItem} activeOpacity={0.7}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactAvatarText}>{contact.avatar}</Text>
                {contact.isOnline && <View style={styles.onlineDot} />}
                <Text style={styles.contactFlag}>{contact.flag}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactLang}>
                  {contact.isTeacher ? "🎓 " : ""}{contact.language}
                </Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity style={styles.contactActionBtn} onPress={() => initiateVoiceCall(contact.id, contact.name)}>
                  <Ionicons name="call" size={16} color={Colors.secondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactActionBtn} onPress={() => initiateVideoCall(contact.id, contact.name)}>
                  <Ionicons name="videocam" size={16} color={Colors.secondary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {/* Add Contact */}
          <TouchableOpacity style={styles.addContactBtn}>
            <Ionicons name="person-add" size={20} color={Colors.secondary} />
            <Text style={styles.addContactText}>Add New Contact</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // ─── DIALPAD TAB ───
  const renderDialpad = () => {
    const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
    const subLabels: Record<string, string> = {
      "1": "", "2": "ABC", "3": "DEF", "4": "GHI", "5": "JKL", "6": "MNO",
      "7": "PQRS", "8": "TUV", "9": "WXYZ", "*": "", "0": "+", "#": "",
    };

    return (
      <View style={styles.dialpadContainer}>
        {/* Number Display */}
        <View style={styles.dialDisplay}>
          <Text style={[styles.dialNumber, !dialNumber && styles.dialNumberPlaceholder]}>
            {dialNumber || ""}
          </Text>
        </View>

        {/* Number Pad — iOS style */}
        <View style={styles.dialGrid}>
          {digits.map((digit) => (
            <TouchableOpacity
              key={digit}
              style={styles.dialKey}
              activeOpacity={0.6}
              onPress={() => handleDial(digit)}
              onLongPress={digit === "0" ? handleLongPressZero : undefined}
              delayLongPress={500}
            >
              <Text style={styles.dialKeyText}>{digit}</Text>
              {subLabels[digit] ? (
                <Text style={styles.dialKeySub}>{subLabels[digit]}</Text>
              ) : digit === "0" ? (
                <Text style={styles.dialKeySub}>+</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* Call Button Row — ConnectWorld AI logo as call button */}
        <View style={styles.dialActions}>
          <View style={styles.dialActionSpacer} />
          <View style={styles.dialLogoBtnWrap}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.dialLogoBtn}
                activeOpacity={0.75}
                onPress={() => router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave" } } as any)}
              >
                <Image
                  source={CONNECTME_LOGO}
                  style={styles.dialLogoBtnImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.dialLogoBtnLabel}>Call</Text>
          </View>
          {dialNumber.length > 0 ? (
            <TouchableOpacity onPress={handleDelete} style={styles.dialSideBtn}>
              <Ionicons name="backspace-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.dialActionSpacer} />
          )}
        </View>

        {/* Translation Note */}
        <View style={styles.dialNote}>
          <Ionicons name="language" size={14} color={Colors.secondary} />
          <Text style={styles.dialNoteText}>Live translation active during call</Text>
        </View>
      </View>
    );
  };

  // ─── VOICEMAIL TAB ───
  const renderVoicemail = () => {
    return (
      <View style={styles.tabContent}>
        <FlatList
          data={VOICEMAILS}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={
            <View style={styles.vmHeader}>
              <Text style={styles.vmHeaderText}>
                {newVoicemailCount} new voicemail{newVoicemailCount !== 1 ? "s" : ""}
              </Text>
              <TouchableOpacity>
                <Text style={styles.vmMarkRead}>Mark all read</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.vmItem, item.isNew && styles.vmItemNew]}>
              <View style={styles.vmTop}>
                <View style={styles.vmSender}>
                  <View style={styles.vmAvatar}>
                    <Text style={styles.vmAvatarText}>{item.avatar}</Text>
                    <Text style={styles.vmFlag}>{item.flag}</Text>
                  </View>
                  <View>
                    <Text style={[styles.vmName, item.isNew && { color: Colors.textPrimary }]}>
                      {item.from}
                    </Text>
                    <Text style={styles.vmTime}>{item.time} · {item.duration}</Text>
                  </View>
                </View>
                {item.isNew && <View style={styles.vmNewDot} />}
              </View>

              {/* Transcription */}
              <View style={styles.vmTranscription}>
                <View style={styles.vmTransRow}>
                  <Ionicons name="text" size={12} color={Colors.textSecondary} />
                  <Text style={styles.vmTransLabel}>Original</Text>
                </View>
                <Text style={styles.vmTransText}>{item.transcription}</Text>
              </View>

              {/* Translation */}
              <View style={styles.vmTranslation}>
                <View style={styles.vmTransRow}>
                  <Ionicons name="language" size={12} color={Colors.secondary} />
                  <Text style={styles.vmTransLabelEn}>Translation</Text>
                </View>
                <Text style={styles.vmTransTextEn}>{item.translation}</Text>
              </View>

              {/* Playback Controls */}
              <View style={styles.vmControls}>
                <TouchableOpacity
                  style={styles.vmPlayBtn}
                  onPress={() => setPlayingVoicemail(playingVoicemail === item.id ? null : item.id)}
                >
                  <Ionicons
                    name={playingVoicemail === item.id ? "pause" : "play"}
                    size={16}
                    color={Colors.secondary}
                  />
                  <Text style={styles.vmPlayText}>
                    {playingVoicemail === item.id ? "Pause" : "Play"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.vmPlayBtn}>
                  <Ionicons name="volume-high" size={16} color={Colors.textSecondary} />
                  <Text style={styles.vmPlayText}>Translated Audio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.vmCallBack} onPress={() => router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave" } } as any)}>
                  <Ionicons name="call" size={14} color="#FFFFFF" />
                  <Text style={styles.vmCallBackText}>Call Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    );
  };

  // ─── VIDEO TAB ───
  const renderVideo = () => {
    return (
      <View style={styles.tabContent}>
        {/* Quick Video Call */}
        <TouchableOpacity style={styles.videoQuickCall} onPress={() => initiateVideoCall("1", "Prof. Carlos")}>
          <View style={styles.videoQuickIcon}>
            <Ionicons name="videocam" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.videoQuickInfo}>
            <Text style={styles.videoQuickTitle}>Start Video Call</Text>
            <Text style={styles.videoQuickSub}>WiFi · No phone number needed · Live translation</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Video History */}
        <Text style={styles.sectionLabel}>RECENT VIDEO CALLS</Text>
        <FlatList
          data={VIDEO_HISTORY}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            const callIcon = getCallIcon(item.type);
            return (
              <TouchableOpacity
                style={styles.callItem}
                activeOpacity={0.7}
                onPress={() => initiateVideoCall(item.id, item.name)}
              >
                <View style={[styles.avatarWrap, item.type === "missed" && styles.avatarMissed]}>
                  <Text style={styles.avatar}>{item.avatar}</Text>
                  <Text style={styles.flagBadge}>{item.flag}</Text>
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam" size={8} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.callContent}>
                  <Text style={[styles.callName, item.type === "missed" && { color: Colors.accent }]}>
                    {item.name}
                  </Text>
                  <View style={styles.callMeta}>
                    <Ionicons name={callIcon.name} size={14} color={callIcon.color} />
                    <Text style={styles.callTime}>{item.time}</Text>
                    {item.duration && <Text style={styles.callDuration}>{item.duration}</Text>}
                  </View>
                </View>
                <TouchableOpacity style={styles.callActionBtn} onPress={() => initiateVideoCall(item.id, item.name)}>
                  <Ionicons name="videocam" size={18} color={Colors.secondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />

        {/* Video Message */}
        <TouchableOpacity style={styles.videoMsgBtn} onPress={() => router.push("/video-message")}>
          <Ionicons name="chatbubble-ellipses" size={18} color={Colors.secondary} />
          <Text style={styles.videoMsgText}>Send Video Message</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "recents": return renderRecents();
      case "contacts": return renderContacts();
      case "dialpad": return renderDialpad();
      case "voicemail": return renderVoicemail();
      case "video": return renderVideo();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Phone</Text>
          <Text style={styles.headerSubtitle}>WiFi Calling · No SIM Required</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={styles.newCallBtn} onPress={() => router.push("/video-call-captions" as any)}>
            <Ionicons name="text-outline" size={18} color={Colors.gold} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.newCallBtn} onPress={() => setActiveTab("dialpad")}>
            <Ionicons name="add" size={22} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-Tab Bar */}
      <View style={styles.subTabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabScroll}>
          {SUB_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.subTab, activeTab === tab.key && styles.subTabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <View style={styles.subTabInner}>
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={activeTab === tab.key ? Colors.secondary : Colors.textSecondary}
                />
                <Text style={[styles.subTabText, activeTab === tab.key && styles.subTabTextActive]}>
                  {tab.label}
                </Text>
                {tab.badge && tab.badge > 0 ? (
                  <View style={styles.subTabBadge}>
                    <Text style={styles.subTabBadgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: Colors.textPrimary },
  headerSubtitle: { fontSize: 11, color: Colors.secondary, marginTop: 2, fontWeight: "600" },
  newCallBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: Colors.glowBorder,
  },

  // Sub-Tab Bar
  subTabBar: { borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  subTabScroll: { paddingHorizontal: Spacing.md, gap: 4, paddingBottom: 8 },
  subTab: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: "transparent",
  },
  subTabActive: {
    backgroundColor: Colors.glowSubtle,
    borderWidth: 1, borderColor: Colors.glowBorder,
  },
  subTabInner: { flexDirection: "row", alignItems: "center", gap: 5 },
  subTabText: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  subTabTextActive: { color: Colors.secondary },
  subTabBadge: {
    backgroundColor: Colors.accent, borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1, marginLeft: 2,
  },
  subTabBadgeText: { fontSize: 9, fontWeight: "700", color: "#FFFFFF" },

  // Tab Content
  tabContent: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  // Filter (Recents)
  filterRow: { flexDirection: "row", marginBottom: Spacing.md, gap: 8 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.glowSubtle, borderColor: Colors.secondary },
  filterText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary },
  filterTextActive: { color: Colors.secondary },

  // Call Items
  callItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: Spacing.md, gap: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  avatarWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: Colors.border, position: "relative",
  },
  avatarMissed: { borderColor: Colors.accent + "60" },
  avatar: { fontSize: 22 },
  flagBadge: { position: "absolute", top: -4, right: -4, fontSize: 12 },
  callContent: { flex: 1 },
  callName: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  callMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  callTime: { fontSize: 12, color: Colors.textSecondary },
  callDuration: { fontSize: 12, color: Colors.textAccent, fontWeight: "500" },
  callLang: { fontSize: 10, color: Colors.textAccent, marginTop: 2, fontWeight: "500" },
  callActions: { flexDirection: "row", gap: 8 },
  callActionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.glowBorder,
  },

  // Contacts
  searchContainer: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: Colors.textSecondary,
    letterSpacing: 0.8, marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  contactItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, gap: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  contactAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border, position: "relative",
  },
  contactAvatarText: { fontSize: 20 },
  onlineDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2, borderColor: Colors.primary,
  },
  contactFlag: { position: "absolute", top: -3, right: -3, fontSize: 10 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  contactLang: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  contactActions: { flexDirection: "row", gap: 6 },
  contactActionBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.glowBorder,
  },
  addContactBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg, borderWidth: 1.5,
    borderColor: Colors.glowBorder, borderStyle: "dashed",
  },
  addContactText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.secondary },

  // Dialpad — iOS Phone neumorphic style
  dialpadContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  dialDisplay: {
    alignItems: "center", justifyContent: "center",
    minHeight: 56, marginBottom: 20, width: "100%",
  },
  dialNumber: { fontSize: 36, fontWeight: "200", color: Colors.textPrimary, letterSpacing: 3 },
  dialNumberPlaceholder: { color: "transparent" },
  deleteBtn: { padding: 8, position: "absolute", right: 0 },
  dialNote: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 16,
  },
  dialNoteText: { fontSize: 11, color: Colors.secondary, fontWeight: "500" },
  dialGrid: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "center", gap: 20,
    maxWidth: 300,
  },
  dialKey: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
    borderWidth: 0.5, borderColor: Colors.border,
  },
  dialKeyText: { fontSize: 30, fontWeight: "400", color: Colors.textPrimary },
  dialKeySub: { fontSize: 9, fontWeight: "700", color: Colors.textSecondary, letterSpacing: 2, marginTop: 1 },
  dialActions: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: 28, paddingHorizontal: 40, width: "100%",
  },
  dialActionSpacer: { flex: 1 },
  dialLogoBtnWrap: {
    alignItems: "center",
  },
  dialLogoBtn: {
    width: 72, height: 72, borderRadius: 36,
    overflow: "hidden",
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
    borderWidth: 2, borderColor: Colors.glowBorder,
  },
  dialLogoBtnImage: {
    width: 72, height: 72, borderRadius: 36,
  },
  dialLogoBtnLabel: {
    fontSize: 11, fontWeight: "600", color: Colors.secondary,
    marginTop: 6, letterSpacing: 0.3,
  },
  dialSideBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
  },
  dialVideoBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: Colors.glowBorder,
  },

  // Voicemail
  vmHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: Spacing.md,
  },
  vmHeaderText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  vmMarkRead: { fontSize: FontSize.sm, color: Colors.secondary, fontWeight: "600" },
  vmItem: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  vmItemNew: { borderColor: Colors.secondary + "50", backgroundColor: Colors.glowSubtle },
  vmTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  vmSender: { flexDirection: "row", alignItems: "center", gap: 10 },
  vmAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  vmAvatarText: { fontSize: 16 },
  vmFlag: { position: "absolute", top: -2, right: -2, fontSize: 10 },
  vmName: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textSecondary },
  vmTime: { fontSize: 11, color: Colors.textSecondary },
  vmNewDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.secondary },
  vmTranscription: {
    backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md,
    padding: 10, marginBottom: 8,
  },
  vmTransRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  vmTransLabel: { fontSize: 9, fontWeight: "700", color: Colors.textSecondary, letterSpacing: 0.5 },
  vmTransText: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 18 },
  vmTranslation: {
    backgroundColor: Colors.glowSubtle, borderRadius: BorderRadius.md,
    padding: 10, marginBottom: 10, borderWidth: 1, borderColor: Colors.glowBorder,
  },
  vmTransLabelEn: { fontSize: 9, fontWeight: "700", color: Colors.secondary, letterSpacing: 0.5 },
  vmTransTextEn: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 18, fontStyle: "italic" },
  vmControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  vmPlayBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  vmPlayText: { fontSize: 11, fontWeight: "600", color: Colors.textSecondary },
  vmCallBack: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary, marginLeft: "auto",
  },
  vmCallBackText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },

  // Video Tab
  videoQuickCall: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.glowBorder,
    marginBottom: Spacing.md,
  },
  videoQuickIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.secondary,
    alignItems: "center", justifyContent: "center",
  },
  videoQuickInfo: { flex: 1 },
  videoQuickTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  videoQuickSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  videoBadge: {
    position: "absolute", bottom: -2, left: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.secondary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  videoMsgBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 14, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.md,
  },
  videoMsgText: { flex: 1, fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
});
