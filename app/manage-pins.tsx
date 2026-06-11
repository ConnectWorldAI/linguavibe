import { useCallback, useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
  Animated,
  LayoutAnimation,
  UIManager,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { shouldPlayHaptic } from "@/lib/sound-settings";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getPinnedFeatures,
  reorderPinnedFeatures,
  bulkUnpinFeatures,
  unpinFeature,
  RecentlyVisitedItem,
} from "@/lib/recently-visited";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SWIPE_THRESHOLD = 80;
const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Swipeable Row Component ───────────────────────────────────────────────────
interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeUnpin: () => void;
  enabled: boolean;
  errorColor: string;
}

function SwipeableRow({ children, onSwipeUnpin, enabled, errorColor }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);
  const currentX = useRef(0);
  const [swiping, setSwiping] = useState(false);

  const handleGrant = (pageX: number) => {
    if (!enabled) return;
    startX.current = pageX;
    currentX.current = 0;
    setSwiping(false);
  };

  const handleMove = (pageX: number) => {
    if (!enabled) return;
    const diff = pageX - startX.current;
    // Only allow left swipe (negative)
    if (diff < -10) {
      setSwiping(true);
      const clampedDiff = Math.max(diff, -SCREEN_WIDTH * 0.4);
      currentX.current = clampedDiff;
      translateX.setValue(clampedDiff);
    }
  };

  const handleRelease = () => {
    if (!enabled) return;
    if (currentX.current < -SWIPE_THRESHOLD) {
      // Trigger unpin
      if (Platform.OS !== "web") {
        shouldPlayHaptic().then((on) => { if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); });
      }
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onSwipeUnpin();
      });
    } else {
      // Snap back
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }
    setSwiping(false);
    currentX.current = 0;
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Background action revealed on swipe */}
      <View style={[styles.swipeBackground, { backgroundColor: errorColor }]}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.swipeBackgroundText}>Unpin</Text>
      </View>

      {/* Foreground row */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        onStartShouldSetResponder={() => enabled}
        onMoveShouldSetResponder={(e) => {
          if (!enabled) return false;
          const diff = e.nativeEvent.pageX - startX.current;
          return Math.abs(diff) > 10 && diff < 0;
        }}
        onResponderGrant={(e) => handleGrant(e.nativeEvent.pageX)}
        onResponderMove={(e) => handleMove(e.nativeEvent.pageX)}
        onResponderRelease={handleRelease}
        onResponderTerminate={handleRelease}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ManagePinsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [pins, setPins] = useState<RecentlyVisitedItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);

  // Track Y positions for drag calculation
  const rowHeight = 64;
  const dragY = useRef(new Animated.Value(0)).current;
  const startY = useRef(0);

  const loadPins = useCallback(async () => {
    const items = await getPinnedFeatures();
    setPins(items);
  }, []);

  useEffect(() => {
    loadPins();
  }, [loadPins]);

  const handleDragStart = (index: number, pageY: number) => {
    if (Platform.OS !== "web") {
      shouldPlayHaptic().then((on) => { if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); });
    }
    startY.current = pageY;
    dragY.setValue(0);
    setDraggingIndex(index);
    setDragTargetIndex(index);
  };

  const handleDragMove = (pageY: number) => {
    if (draggingIndex === null) return;
    const diff = pageY - startY.current;
    dragY.setValue(diff);

    const rawTarget = draggingIndex + Math.round(diff / rowHeight);
    const target = Math.max(0, Math.min(pins.length - 1, rawTarget));
    if (target !== dragTargetIndex) {
      setDragTargetIndex(target);
      if (Platform.OS !== "web") {
        shouldPlayHaptic().then((on) => { if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); });
      }
    }
  };

  const handleDragEnd = async () => {
    if (draggingIndex === null || dragTargetIndex === null) return;

    if (draggingIndex !== dragTargetIndex) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const newPins = [...pins];
      const [moved] = newPins.splice(draggingIndex, 1);
      newPins.splice(dragTargetIndex, 0, moved);
      setPins(newPins);
      await reorderPinnedFeatures(newPins.map((p) => p.id));
      if (Platform.OS !== "web") {
        const hapticOn = await shouldPlayHaptic();
        if (hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }

    setDraggingIndex(null);
    setDragTargetIndex(null);
    dragY.setValue(0);
  };

  const handleSwipeUnpin = async (id: string) => {
    await unpinFeature(id);
    if (Platform.OS !== "web") {
      const hapticOn = await shouldPlayHaptic();
      if (hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    loadPins();
  };

  const handleUnpinSingle = async (id: string) => {
    const doUnpin = async () => {
      await unpinFeature(id);
      if (Platform.OS !== "web") {
        const hapticOn = await shouldPlayHaptic();
        if (hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      loadPins();
    };

    if (Platform.OS === "web") {
      await doUnpin();
    } else {
      Alert.alert("Unpin", "Remove this item from your pins?", [
        { text: "Cancel", style: "cancel" },
        { text: "Unpin", style: "destructive", onPress: doUnpin },
      ]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkUnpin = async () => {
    if (selectedIds.size === 0) return;

    const doUnpin = async () => {
      await bulkUnpinFeatures(Array.from(selectedIds));
      if (Platform.OS !== "web") {
        const hapticOn = await shouldPlayHaptic();
        if (hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSelectedIds(new Set());
      setIsSelecting(false);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      loadPins();
    };

    if (Platform.OS === "web") {
      await doUnpin();
    } else {
      Alert.alert(
        "Bulk Unpin",
        `Remove ${selectedIds.size} item${selectedIds.size > 1 ? "s" : ""} from your pins?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Unpin All", style: "destructive", onPress: doUnpin },
        ]
      );
    }
  };

  const renderItem = ({ item, index }: { item: RecentlyVisitedItem; index: number }) => {
    const isSelected = selectedIds.has(item.id);
    const isDragging = draggingIndex === index;
    const isDropTarget = dragTargetIndex === index && draggingIndex !== null && draggingIndex !== index;

    const rowContent = (
      <Animated.View
        style={[
          styles.row,
          { borderBottomColor: colors.border, backgroundColor: colors.background },
          isSelected && { backgroundColor: colors.primary + "15" },
          isDragging && {
            backgroundColor: colors.surface,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            zIndex: 999,
            transform: [{ translateY: dragY as any }],
          },
          isDropTarget && {
            borderTopWidth: 2,
            borderTopColor: colors.primary,
          },
        ]}
      >
        {/* Drag handle (non-selecting mode) */}
        {!isSelecting && (
          <View
            style={styles.dragHandle}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => handleDragStart(index, e.nativeEvent.pageY)}
            onResponderMove={(e) => handleDragMove(e.nativeEvent.pageY)}
            onResponderRelease={handleDragEnd}
            onResponderTerminate={handleDragEnd}
          >
            <Ionicons name="reorder-three" size={22} color={colors.muted} />
          </View>
        )}

        {/* Selection checkbox */}
        {isSelecting && (
          <Pressable
            onPress={() => toggleSelect(item.id)}
            style={({ pressed }) => [styles.checkbox, pressed && { opacity: 0.6 }]}
          >
            <Ionicons
              name={isSelected ? "checkbox" : "square-outline"}
              size={22}
              color={isSelected ? colors.primary : colors.muted}
            />
          </Pressable>
        )}

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + "10" }]}>
          <Ionicons name={(item.icon as any) || "bookmark"} size={20} color={colors.primary} />
        </View>

        {/* Label */}
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.foreground }]} numberOfLines={1}>
            {item.title}
          </Text>
          {(item as any).category && (
            <Text style={[styles.category, { color: colors.muted }]} numberOfLines={1}>
              {(item as any).category}
            </Text>
          )}
        </View>

        {/* Swipe indicator (chevron hint) */}
        {!isSelecting && (
          <Ionicons name="chevron-back" size={14} color={colors.muted} style={{ opacity: 0.4 }} />
        )}
      </Animated.View>
    );

    // Wrap in SwipeableRow when not in selection mode and not dragging
    if (!isSelecting && draggingIndex === null) {
      return (
        <SwipeableRow
          onSwipeUnpin={() => handleSwipeUnpin(item.id)}
          enabled={!isSelecting && draggingIndex === null}
          errorColor={colors.error}
        >
          {rowContent}
        </SwipeableRow>
      );
    }

    return rowContent;
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Manage Pins</Text>
        <Pressable
          onPress={() => {
            if (isSelecting) {
              setIsSelecting(false);
              setSelectedIds(new Set());
            } else {
              setIsSelecting(true);
            }
          }}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.editBtn, { color: colors.primary }]}>
            {isSelecting ? "Done" : "Select"}
          </Text>
        </Pressable>
      </View>

      {/* Bulk action bar */}
      {isSelecting && selectedIds.size > 0 && (
        <View style={[styles.bulkBar, { backgroundColor: colors.surface }]}>
          <Text style={[styles.bulkText, { color: colors.foreground }]}>
            {selectedIds.size} selected
          </Text>
          <Pressable
            onPress={handleBulkUnpin}
            style={({ pressed }) => [
              styles.bulkBtn,
              { backgroundColor: colors.error },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text style={styles.bulkBtnText}>Unpin All</Text>
          </Pressable>
        </View>
      )}

      {/* Empty state */}
      {pins.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="pin-outline" size={48} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No pinned features yet
          </Text>
          <Text style={[styles.emptyHint, { color: colors.muted }]}>
            Long-press any item in the Recently Visited row to pin it here
          </Text>
        </View>
      )}

      {/* Pin list */}
      <FlatList
        data={pins}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        scrollEnabled={draggingIndex === null}
      />

      {/* Hint */}
      {pins.length > 0 && !isSelecting && (
        <View style={styles.hint}>
          <Ionicons name="hand-left-outline" size={14} color={colors.muted} />
          <Text style={[styles.hintText, { color: colors.muted }]}>
            Swipe left to unpin • Drag ≡ to reorder • "Select" for bulk actions
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  editBtn: {
    fontSize: 15,
    fontWeight: "500",
  },
  bulkBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bulkText: {
    fontSize: 14,
    fontWeight: "500",
  },
  bulkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    paddingBottom: 80,
  },
  swipeContainer: {
    overflow: "hidden",
  },
  swipeBackground: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 24,
    gap: 8,
  },
  swipeBackgroundText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    minHeight: 64,
  },
  dragHandle: {
    paddingRight: 12,
    paddingVertical: 8,
  },
  checkbox: {
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
  },
  category: {
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  emptyHint: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hintText: {
    fontSize: 12,
    textAlign: "center",
  },
});
