import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, BorderRadius } from "../constants/Colors";
import { useSavedCollections, SavedFolder, SavedItem } from "@/lib/saved-collections";

type ViewMode = "folders" | "items";

export default function SavedCollectionsScreen() {
  const {
    items,
    folders,
    getItemsInFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    unsaveItem,
    moveItem,
  } = useSavedCollections();

  const [viewMode, setViewMode] = useState<ViewMode>("folders");
  const [selectedFolder, setSelectedFolder] = useState<SavedFolder | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");

  const currentItems = useMemo(() => {
    if (!selectedFolder) return items;
    return getItemsInFolder(selectedFolder.id);
  }, [selectedFolder, items, getItemsInFolder]);

  const handleOpenFolder = (folder: SavedFolder) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedFolder(folder);
    setViewMode("items");
  };

  const handleBack = () => {
    if (viewMode === "items") {
      setSelectedFolder(null);
      setViewMode("folders");
    } else {
      router.back();
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    createFolder(newFolderName.trim());
    setNewFolderName("");
    setShowNewFolder(false);
  };

  const handleDeleteFolder = (folder: SavedFolder) => {
    if (folder.isDefault) return;
    Alert.alert(
      "Delete Collection",
      `Delete "${folder.name}"? Saved items will move to "All Saved".`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteFolder(folder.id);
            if (selectedFolder?.id === folder.id) {
              setSelectedFolder(null);
              setViewMode("folders");
            }
          },
        },
      ]
    );
  };

  const handleRenameFolder = (folderId: string) => {
    if (!editFolderName.trim()) {
      setEditingFolderId(null);
      return;
    }
    renameFolder(folderId, editFolderName.trim());
    setEditingFolderId(null);
    setEditFolderName("");
  };

  const handleUnsaveItem = (itemId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    unsaveItem(itemId);
  };

  const getItemIcon = (type: string): string => {
    switch (type) {
      case "video": return "play-circle";
      case "lesson": return "school";
      case "song": return "musical-notes";
      case "post": return "document-text";
      case "article": return "newspaper";
      case "cultural": return "globe";
      default: return "bookmark";
    }
  };

  const getItemColor = (type: string): string => {
    switch (type) {
      case "video": return "#EF4444";
      case "lesson": return "#8B5CF6";
      case "song": return "#EC4899";
      case "post": return "#3B82F6";
      case "article": return "#10B981";
      case "cultural": return "#F59E0B";
      default: return Colors.textSecondary;
    }
  };

  // ─── RENDER FOLDER GRID ───
  const renderFolderCard = ({ item: folder }: { item: SavedFolder }) => {
    const folderItems = getItemsInFolder(folder.id);
    const count = folderItems.length;

    if (editingFolderId === folder.id) {
      return (
        <View style={styles.folderCard}>
          <TextInput
            style={styles.folderEditInput}
            value={editFolderName}
            onChangeText={setEditFolderName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => handleRenameFolder(folder.id)}
            onBlur={() => handleRenameFolder(folder.id)}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.folderCard}
        onPress={() => handleOpenFolder(folder)}
        onLongPress={() => {
          if (!folder.isDefault) {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            Alert.alert(folder.name, "What would you like to do?", [
              {
                text: "Rename",
                onPress: () => {
                  setEditingFolderId(folder.id);
                  setEditFolderName(folder.name);
                },
              },
              { text: "Delete", style: "destructive", onPress: () => handleDeleteFolder(folder) },
              { text: "Cancel", style: "cancel" },
            ]);
          }
        }}
        activeOpacity={0.7}
      >
        {/* Folder thumbnail preview */}
        <View style={styles.folderPreview}>
          {folderItems.slice(0, 4).map((item, idx) => (
            <View
              key={item.id}
              style={[styles.folderPreviewItem, { backgroundColor: getItemColor(item.type) + "30" }]}
            >
              <Ionicons name={getItemIcon(item.type) as any} size={16} color={getItemColor(item.type)} />
            </View>
          ))}
          {count === 0 && (
            <View style={styles.folderEmpty}>
              <Text style={styles.folderEmoji}>{folder.emoji || "📁"}</Text>
            </View>
          )}
        </View>
        <Text style={styles.folderName} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text style={styles.folderCount}>
          {count} {count === 1 ? "item" : "items"}
        </Text>
      </TouchableOpacity>
    );
  };

  // ─── RENDER SAVED ITEM ───
  const renderSavedItem = ({ item }: { item: SavedItem }) => (
    <View style={styles.itemRow}>
      {/* Thumbnail or icon */}
      <View style={[styles.itemThumb, { backgroundColor: getItemColor(item.type) + "20" }]}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.itemThumbImage} />
        ) : (
          <Ionicons name={getItemIcon(item.type) as any} size={24} color={getItemColor(item.type)} />
        )}
      </View>

      {/* Info */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.itemMeta}>
          {item.languageFlag && <Text style={styles.itemFlag}>{item.languageFlag}</Text>}
          <Text style={styles.itemSubtitle} numberOfLines={1}>
            {item.subtitle || item.type}
          </Text>
          {item.duration && <Text style={styles.itemDuration}>{item.duration}</Text>}
        </View>
      </View>

      {/* Unsave button */}
      <TouchableOpacity
        onPress={() => handleUnsaveItem(item.id)}
        style={styles.unsaveBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="bookmark" size={20} color={Colors.secondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {viewMode === "folders" ? "Saved" : selectedFolder?.name || "All Saved"}
        </Text>
        {viewMode === "folders" && (
          <TouchableOpacity onPress={() => setShowNewFolder(true)} style={styles.addBtn}>
            <Ionicons name="add" size={24} color={Colors.secondary} />
          </TouchableOpacity>
        )}
        {viewMode === "items" && <View style={{ width: 32 }} />}
      </View>

      {/* New folder input */}
      {showNewFolder && (
        <View style={styles.newFolderBar}>
          <TextInput
            style={styles.newFolderInput}
            placeholder="Collection name..."
            placeholderTextColor={Colors.textMuted}
            value={newFolderName}
            onChangeText={setNewFolderName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreateFolder}
          />
          <TouchableOpacity
            style={[styles.createBtn, !newFolderName.trim() && styles.createBtnDisabled]}
            onPress={handleCreateFolder}
            disabled={!newFolderName.trim()}
          >
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowNewFolder(false); setNewFolderName(""); }}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {viewMode === "folders" ? (
        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          renderItem={renderFolderCard}
          numColumns={2}
          columnWrapperStyle={styles.folderRow}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Collections Yet</Text>
              <Text style={styles.emptySubtitle}>
                Save videos, lessons, and posts to organize your learning
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={currentItems}
          keyExtractor={(item) => item.id}
          renderItem={renderSavedItem}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Nothing Saved Here</Text>
              <Text style={styles.emptySubtitle}>
                Tap the bookmark icon on any content to save it here
              </Text>
            </View>
          }
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  addBtn: {
    padding: 4,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  // Folder grid
  folderRow: {
    justifyContent: "space-between",
    marginBottom: 14,
  },
  folderCard: {
    width: "47%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  folderPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    height: 72,
    marginBottom: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  folderPreviewItem: {
    width: "48%",
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  folderEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  folderEmoji: {
    fontSize: 28,
  },
  folderName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  folderCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  folderEditInput: {
    height: 36,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  // Item list
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  itemThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  itemThumbImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  itemFlag: {
    fontSize: 13,
  },
  itemSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  itemDuration: {
    fontSize: 11,
    color: Colors.textMuted,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unsaveBtn: {
    padding: 4,
  },
  // New folder bar
  newFolderBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  newFolderInput: {
    flex: 1,
    height: 38,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  createBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
  },
  createBtnDisabled: {
    opacity: 0.4,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
