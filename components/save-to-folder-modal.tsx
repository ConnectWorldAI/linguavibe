import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, BorderRadius } from "../constants/Colors";
import { useSavedCollections, SavedFolder } from "@/lib/saved-collections";

interface SaveToFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (folderId: string) => void;
}

export function SaveToFolderModal({ visible, onClose, onSave }: SaveToFolderModalProps) {
  const { folders, createFolder } = useSavedCollections();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleSelectFolder = (folderId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSave(folderId);
    onClose();
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const folder = createFolder(newFolderName.trim());
    setNewFolderName("");
    setShowNewFolder(false);
    onSave(folder.id);
    onClose();
  };

  const renderFolder = ({ item }: { item: SavedFolder }) => (
    <TouchableOpacity
      style={styles.folderRow}
      onPress={() => handleSelectFolder(item.id)}
      activeOpacity={0.7}
    >
      <Text style={styles.folderEmoji}>{item.emoji || "📁"}</Text>
      <Text style={styles.folderName}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Save to Collection</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Folders list */}
          <FlatList
            data={folders}
            keyExtractor={(item) => item.id}
            renderItem={renderFolder}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />

          {/* New folder input */}
          {showNewFolder ? (
            <View style={styles.newFolderRow}>
              <TextInput
                style={styles.newFolderInput}
                placeholder="Folder name..."
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
            </View>
          ) : (
            <TouchableOpacity
              style={styles.newFolderBtn}
              onPress={() => setShowNewFolder(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={22} color={Colors.secondary} />
              <Text style={styles.newFolderBtnText}>New Collection</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "60%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    maxHeight: 280,
  },
  listContent: {
    paddingVertical: 8,
  },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  folderEmoji: {
    fontSize: 22,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  newFolderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  newFolderBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.secondary,
  },
  newFolderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  newFolderInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  createBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
  },
  createBtnDisabled: {
    opacity: 0.4,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
