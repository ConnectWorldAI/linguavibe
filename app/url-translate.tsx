import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useSavedCollections } from "@/lib/saved-collections";

export default function URLTranslateScreen() {
  const [url, setUrl] = useState("");
  const [showSavedPicker, setShowSavedPicker] = useState(false);
  const { items } = useSavedCollections();

  // Filter saved items that have URLs (videos, articles, posts)
  const savedWithUrls = items.filter(
    (item) => item.type === "video" || item.type === "article" || item.type === "post"
  );

  const handlePickSaved = (title: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Use the title as a placeholder URL (in real use, items would have a sourceUrl field)
    setUrl(title);
    setShowSavedPicker(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>URL Translate</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* URL Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Paste a URL</Text>
          <Text style={styles.inputSubtitle}>
            YouTube, TikTok, Instagram, or any website
          </Text>
          <View style={styles.urlRow}>
            <Ionicons name="link" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.urlInput}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor={Colors.textMuted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            {/* Favorites/Saved icon to pick from saved items */}
            <TouchableOpacity
              onPress={() => setShowSavedPicker(true)}
              style={styles.savedPickerBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="bookmark" size={20} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Supported Platforms */}
        <Text style={styles.sectionTitle}>Supported Platforms</Text>
        <View style={styles.platformGrid}>
          {[
            { icon: "logo-youtube", name: "YouTube", color: "#FF0000" },
            { icon: "logo-tiktok", name: "TikTok", color: "#69C9D0" },
            { icon: "logo-instagram", name: "Instagram", color: "#E4405F" },
            { icon: "globe-outline", name: "Any Website", color: Colors.secondary },
          ].map((platform, index) => (
            <View key={index} style={styles.platformCard}>
              <Ionicons name={platform.icon as any} size={28} color={platform.color} />
              <Text style={styles.platformName}>{platform.name}</Text>
            </View>
          ))}
        </View>

        {/* How it works */}
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsCard}>
          {[
            { step: "1", text: "Paste any video or website URL" },
            { step: "2", text: "Choose your target language & style" },
            { step: "3", text: "Get instant translation with audio" },
          ].map((item, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>{item.step}</Text>
              </View>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Translate Button */}
        <TouchableOpacity
          style={[styles.translateBtn, !url.trim() && styles.translateBtnDisabled]}
          activeOpacity={0.8}
        >
          <Ionicons name="language" size={20} color={Colors.textPrimary} />
          <Text style={styles.translateBtnText}>Translate URL</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Saved Items Picker Modal */}
      <Modal visible={showSavedPicker} transparent animationType="slide" onRequestClose={() => setShowSavedPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick from Saved</Text>
              <TouchableOpacity onPress={() => setShowSavedPicker(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {savedWithUrls.length === 0 ? (
              <View style={styles.emptyModal}>
                <Ionicons name="bookmark-outline" size={36} color={Colors.textMuted} />
                <Text style={styles.emptyModalText}>No saved videos or articles yet</Text>
                <Text style={styles.emptyModalSub}>Save content from the Explore feed to quickly translate it here</Text>
              </View>
            ) : (
              <FlatList
                data={savedWithUrls}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.savedItemRow}
                    onPress={() => handlePickSaved(item.title)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.type === "video" ? "play-circle" : "document-text"}
                      size={22}
                      color={item.type === "video" ? "#EF4444" : "#3B82F6"}
                    />
                    <View style={styles.savedItemInfo}>
                      <Text style={styles.savedItemTitle} numberOfLines={1}>{item.title}</Text>
                      {item.subtitle && <Text style={styles.savedItemSub} numberOfLines={1}>{item.subtitle}</Text>}
                    </View>
                    {item.languageFlag && <Text style={styles.savedItemFlag}>{item.languageFlag}</Text>}
                  </TouchableOpacity>
                )}
                style={styles.savedList}
              />
            )}
          </View>
        </View>
      </Modal>
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  inputCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(30, 144, 255, 0.3)",
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  inputSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 8,
  },
  urlInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  platformCard: {
    width: "48%",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  stepsCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(30, 144, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.secondary,
  },
  stepText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  translateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  translateBtnDisabled: {
    opacity: 0.5,
  },
  translateBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  savedPickerBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(30, 144, 255, 0.1)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "55%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  emptyModal: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyModalText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  emptyModalSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  savedList: {
    maxHeight: 300,
  },
  savedItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  savedItemInfo: {
    flex: 1,
  },
  savedItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  savedItemSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  savedItemFlag: {
    fontSize: 16,
  },
});
