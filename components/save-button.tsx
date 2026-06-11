import React, { useState } from "react";
import { TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "../constants/Colors";
import { useSavedCollections, SavedItem, SavedItemType } from "@/lib/saved-collections";
import { SaveToFolderModal } from "./save-to-folder-modal";

interface SaveButtonProps {
  itemId: string;
  itemType: SavedItemType;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  icon?: string;
  iconColor?: string;
  language?: string;
  languageFlag?: string;
  duration?: string;
  sourceScreen?: string;
  size?: number;
  style?: any;
}

export function SaveButton({
  itemId,
  itemType,
  title,
  subtitle,
  thumbnail,
  icon,
  iconColor,
  language,
  languageFlag,
  duration,
  sourceScreen,
  size = 22,
  style,
}: SaveButtonProps) {
  const { isItemSaved, saveItem, unsaveItem } = useSavedCollections();
  const [showModal, setShowModal] = useState(false);
  const saved = isItemSaved(itemId);

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (saved) {
      unsaveItem(itemId);
    } else {
      setShowModal(true);
    }
  };

  const handleSaveToFolder = (folderId: string) => {
    saveItem(
      {
        id: itemId,
        type: itemType,
        title,
        subtitle,
        thumbnail,
        icon,
        iconColor,
        language,
        languageFlag,
        duration,
        sourceScreen,
      },
      folderId
    );
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.btn, style]}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={saved ? "bookmark" : "bookmark-outline"}
          size={size}
          color={saved ? Colors.secondary : Colors.textSecondary}
        />
      </TouchableOpacity>
      <SaveToFolderModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveToFolder}
      />
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
  },
});
