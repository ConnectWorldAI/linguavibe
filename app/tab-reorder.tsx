import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useTabOrder, DEFAULT_TAB_ORDER, TAB_META } from "@/lib/tab-order-context";
import * as Haptics from "expo-haptics";

export default function TabReorderScreen() {
  const router = useRouter();
  const { tabOrder, setTabOrder, resetTabOrder } = useTabOrder();
  const [order, setOrder] = useState<string[]>([...tabOrder]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleTapItem = useCallback((index: number) => {
    if (selectedIndex === null) {
      // First tap: select this item
      setSelectedIndex(index);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else if (selectedIndex === index) {
      // Tap same item: deselect
      setSelectedIndex(null);
    } else {
      // Tap different item: swap them
      const newOrder = [...order];
      const temp = newOrder[selectedIndex];
      newOrder[selectedIndex] = newOrder[index];
      newOrder[index] = temp;
      setOrder(newOrder);
      setSelectedIndex(null);
      setHasChanges(true);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [selectedIndex, order]);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newOrder = [...order];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    setOrder(newOrder);
    setHasChanges(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [order]);

  const moveDown = useCallback((index: number) => {
    if (index === order.length - 1) return;
    const newOrder = [...order];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    setOrder(newOrder);
    setHasChanges(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [order]);

  const handleSave = useCallback(async () => {
    await setTabOrder(order);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert("Saved", "Tab order updated. Changes will apply immediately.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }, [order, setTabOrder, router]);

  const handleReset = useCallback(async () => {
    Alert.alert("Reset Tab Order", "Restore default tab arrangement?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          await resetTabOrder();
          setOrder([...DEFAULT_TAB_ORDER]);
          setSelectedIndex(null);
          setHasChanges(false);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ]);
  }, [resetTabOrder]);

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#ECEDEE" />
          </TouchableOpacity>
          <Text style={styles.title}>Reorder Tabs</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Ionicons name="information-circle" size={18} color="#00AAFF" />
          <Text style={styles.instructionText}>
            Tap a tab to select it, then tap another to swap positions. Or use the arrows to move tabs up/down.
          </Text>
        </View>

        {/* Preview of tab bar */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>PREVIEW</Text>
          <View style={styles.previewBar}>
            {order.map((tabName) => {
              const meta = TAB_META[tabName];
              if (!meta) return null;
              return (
                <View key={tabName} style={styles.previewTab}>
                  <Ionicons name={meta.iconFocused as any} size={18} color="#3D5A7A" />
                  <Text style={styles.previewTabLabel} numberOfLines={1}>{meta.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Reorder list */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionLabel}>TAB ORDER (LEFT TO RIGHT)</Text>
          {order.map((tabName, index) => {
            const meta = TAB_META[tabName];
            if (!meta) return null;
            const isSelected = selectedIndex === index;

            return (
              <View
                key={tabName}
                style={[
                  styles.listItem,
                  isSelected && styles.listItemSelected,
                ]}
              >
                <View style={styles.listItemLeft}>
                  <Text style={styles.positionNumber}>{index + 1}</Text>
                  <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                    <Ionicons name={meta.iconFocused as any} size={20} color={isSelected ? "#00AAFF" : "#ECEDEE"} />
                  </View>
                  <TouchableOpacity
                    style={styles.labelArea}
                    onPress={() => handleTapItem(index)}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.listItemLabel, isSelected && styles.listItemLabelSelected]}>
                      {meta.label}
                    </Text>
                    <Text style={styles.listItemHint}>
                      {isSelected ? "Tap another to swap" : "Tap to select"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.arrowBtns}>
                  <TouchableOpacity
                    onPress={() => moveUp(index)}
                    disabled={index === 0}
                    style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
                  >
                    <Ionicons name="chevron-up" size={20} color={index === 0 ? "#1a2a3a" : "#00AAFF"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveDown(index)}
                    disabled={index === order.length - 1}
                    style={[styles.arrowBtn, index === order.length - 1 && styles.arrowBtnDisabled]}
                  >
                    <Ionicons name="chevron-down" size={20} color={index === order.length - 1 ? "#1a2a3a" : "#00AAFF"} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Save button */}
        {hasChanges && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={20} color="#040810" />
            <Text style={styles.saveBtnText}>Save Tab Order</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040810",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ECEDEE",
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  resetText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },
  instructions: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.2)",
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: "#9BA1A6",
    lineHeight: 18,
  },
  previewContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3D5A7A",
    letterSpacing: 1,
    marginBottom: 8,
  },
  previewBar: {
    flexDirection: "row",
    backgroundColor: "#0A1628",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.15)",
  },
  previewTab: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  previewTabLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#3D5A7A",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3D5A7A",
    letterSpacing: 1,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 14,
    backgroundColor: "#0A1628",
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.1)",
  },
  listItemSelected: {
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    borderColor: "#00AAFF",
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  positionNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3D5A7A",
    width: 20,
    textAlign: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleSelected: {
    backgroundColor: "rgba(0, 170, 255, 0.2)",
  },
  labelArea: {
    flex: 1,
  },
  listItemLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ECEDEE",
  },
  listItemLabelSelected: {
    color: "#00AAFF",
  },
  listItemHint: {
    fontSize: 11,
    color: "#3D5A7A",
    marginTop: 1,
  },
  arrowBtns: {
    flexDirection: "column",
    gap: 2,
  },
  arrowBtn: {
    padding: 4,
  },
  arrowBtnDisabled: {
    opacity: 0.3,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#00AAFF",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#040810",
  },
});
