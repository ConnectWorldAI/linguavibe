import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/Colors";
import { TEACHER_REGISTRY, Teacher } from "@/lib/teacher-registry";

// Types
interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  language?: string;
  type: "teacher" | "penpal";
}

// Generate available contacts from teachers + pen pals
const AVAILABLE_CONTACTS: GroupMember[] = [
  ...TEACHER_REGISTRY.slice(0, 15).map((t: Teacher) => ({
    id: t.id,
    name: t.name,
    avatar: t.origin.includes("Mexico") ? "🇲🇽" : t.origin.includes("Spain") ? "🇪🇸" : t.origin.includes("Japan") ? "🇯🇵" : t.origin.includes("France") ? "🇫🇷" : t.origin.includes("Germany") ? "🇩🇪" : t.origin.includes("Italy") ? "🇮🇹" : t.origin.includes("Brazil") ? "🇧🇷" : t.origin.includes("Korea") ? "🇰🇷" : t.origin.includes("China") ? "🇨🇳" : t.origin.includes("India") ? "🇮🇳" : t.origin.includes("Russia") ? "🇷🇺" : t.origin.includes("Arab") ? "🇸🇦" : "🌍",
    language: t.nativeLanguages[0] || "Multilingual",
    type: "teacher" as const,
  })),
  { id: "penpal_1", name: "Carlos", avatar: "🇲🇽", language: "Spanish", type: "penpal" },
  { id: "penpal_2", name: "Yuki", avatar: "🇯🇵", language: "Japanese", type: "penpal" },
  { id: "penpal_3", name: "Pierre", avatar: "🇫🇷", language: "French", type: "penpal" },
  { id: "penpal_4", name: "Hans", avatar: "🇩🇪", language: "German", type: "penpal" },
  { id: "penpal_5", name: "Priya", avatar: "🇮🇳", language: "Hindi", type: "penpal" },
];

export default function CreateGroupChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contactId?: string; contactName?: string }>();

  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (params.contactId) initial.add(params.contactId);
    return initial;
  });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = AVAILABLE_CONTACTS.filter((c) => {
    if (!searchQuery.trim()) return true;
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.language && c.language.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const toggleMember = useCallback((id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 10) {
          Alert.alert("Limit Reached", "Groups can have up to 10 members.");
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }, []);

  const createGroup = () => {
    if (selectedMembers.size < 2) {
      Alert.alert("Select Members", "Please select at least 2 members for the group.");
      return;
    }
    if (!groupName.trim()) {
      Alert.alert("Group Name", "Please enter a name for your group.");
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Group Created!",
      `"${groupName}" with ${selectedMembers.size} members has been created. Start a multi-person language practice session!`,
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  const renderSelectedChips = () => {
    const selected = AVAILABLE_CONTACTS.filter((c) => selectedMembers.has(c.id));
    if (selected.length === 0) return null;
    return (
      <View style={styles.chipsContainer}>
        <FlatList
          horizontal
          data={selected}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chip}
              onPress={() => toggleMember(item.id)}
            >
              <Text style={styles.chipAvatar}>{item.avatar}</Text>
              <Text style={styles.chipName} numberOfLines={1}>{item.name}</Text>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderContact = ({ item }: { item: GroupMember }) => {
    const isSelected = selectedMembers.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.contactRow, isSelected && styles.contactRowSelected]}
        onPress={() => toggleMember(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.contactAvatarWrap}>
          <Text style={styles.contactAvatar}>{item.avatar}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactMeta}>
            {item.language} • {item.type === "teacher" ? "Teacher" : "Pen Pal"}
          </Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
        <TouchableOpacity
          style={[styles.createBtn, selectedMembers.size < 2 && styles.createBtnDisabled]}
          onPress={createGroup}
          disabled={selectedMembers.size < 2}
        >
          <Text style={[styles.createBtnText, selectedMembers.size < 2 && styles.createBtnTextDisabled]}>
            Create
          </Text>
        </TouchableOpacity>
      </View>

      {/* Group Name Input */}
      <View style={styles.groupNameSection}>
        <View style={styles.groupIconWrap}>
          <Ionicons name="people" size={28} color={Colors.secondary} />
        </View>
        <TextInput
          style={styles.groupNameInput}
          placeholder="Group name (required)"
          placeholderTextColor={Colors.textMuted}
          value={groupName}
          onChangeText={setGroupName}
          maxLength={30}
        />
      </View>

      {/* Selected Members Chips */}
      {renderSelectedChips()}

      {/* Member Count */}
      <View style={styles.memberCountRow}>
        <Text style={styles.memberCountText}>
          {selectedMembers.size} of 10 members selected
        </Text>
        <Text style={styles.memberCountHint}>Min 2 required</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        }
      />

      {/* Group Description */}
      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
        <Text style={styles.footerText}>
          Create a group for multi-person language practice sessions. Members can chat, share media, and practice together.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
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
  },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary,
  },
  createBtnDisabled: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  createBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  createBtnTextDisabled: {
    color: Colors.textMuted,
  },
  groupNameSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  groupIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  groupNameInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: 8,
  },
  chipsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary + "15",
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  chipAvatar: {
    fontSize: 16,
  },
  chipName: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: "500",
    maxWidth: 80,
  },
  memberCountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
  },
  memberCountText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
  memberCountHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.lg,
    marginBottom: 4,
    gap: 12,
  },
  contactRowSelected: {
    backgroundColor: Colors.secondary + "10",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  contactAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactAvatar: {
    fontSize: 22,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  contactMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
  },
  footerText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
