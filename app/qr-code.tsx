import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const { width } = Dimensions.get("window");
const QR_SIZE = width * 0.65;

// Simulated QR code pattern (visual representation)
function QRCodeVisual() {
  const gridSize = 21;
  const cellSize = QR_SIZE / gridSize;
  // Generate a deterministic pattern for visual QR code
  const pattern = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Corner squares (finder patterns)
      const isTopLeft = row < 7 && col < 7;
      const isTopRight = row < 7 && col >= gridSize - 7;
      const isBottomLeft = row >= gridSize - 7 && col < 7;

      if (isTopLeft || isTopRight || isBottomLeft) {
        // Finder pattern borders
        const isOuterBorder =
          row === 0 || row === 6 || col === 0 || col === 6 ||
          (row >= gridSize - 7 && (row === gridSize - 7 || row === gridSize - 1)) ||
          (col >= gridSize - 7 && (col === gridSize - 7 || col === gridSize - 1));
        const isInnerFill =
          (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
          (row >= 2 && row <= 4 && col >= gridSize - 5 && col <= gridSize - 3) ||
          (row >= gridSize - 5 && row <= gridSize - 3 && col >= 2 && col <= 4);

        if (isOuterBorder || isInnerFill) {
          pattern.push({ row, col, filled: true });
        } else {
          pattern.push({ row, col, filled: false });
        }
      } else {
        // Data area - pseudo-random based on position
        const filled = ((row * 7 + col * 13 + row * col) % 3) !== 0;
        pattern.push({ row, col, filled });
      }
    }
  }

  return (
    <View style={[qrStyles.container, { width: QR_SIZE, height: QR_SIZE }]}>
      {pattern.map((cell, i) => (
        <View
          key={i}
          style={[
            qrStyles.cell,
            {
              width: cellSize,
              height: cellSize,
              left: cell.col * cellSize,
              top: cell.row * cellSize,
              backgroundColor: cell.filled ? Colors.primary : "#FFFFFF",
            },
          ]}
        />
      ))}
      {/* Center logo overlay */}
      <View style={qrStyles.centerLogo}>
        <View style={qrStyles.logoCircle}>
          <Ionicons name="globe" size={24} color={Colors.secondary} />
        </View>
      </View>
    </View>
  );
}

const qrStyles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  cell: {
    position: "absolute",
  },
  centerLogo: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -22 }, { translateY: -22 }],
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
});

export default function QRCodeScreen() {
  const [scanMode, setScanMode] = useState(false);

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Share.share({
        message: "Add me on ConnectWorld AI! Scan my QR code or visit: https://connectworld.ai/u/jordan_speaks",
        title: "My ConnectWorld AI Profile",
      });
    } catch (e) {
      // Share cancelled
    }
  };

  const handleScan = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setScanMode(true);
    // Simulate scanning someone's QR code
    setTimeout(() => {
      setScanMode(false);
      if (Platform.OS === "web") {
        alert("Contact Added!\n\nYou are now following Maria Santos.\nHer contact info has been saved.");
      } else {
        Alert.alert(
          "Contact Added!",
          "You are now following Maria Santos.\nHer contact info has been saved to your contacts.",
          [{ text: "View Profile", onPress: () => {} }, { text: "OK" }]
        );
      }
    }, 2500);
  };

  const handleResetQR = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (Platform.OS === "web") {
      alert("QR code has been reset. Your old QR code will no longer work.");
    } else {
      Alert.alert(
        "Reset QR Code?",
        "Your current QR code will stop working. Anyone who has your old QR code will need the new one.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reset", style: "destructive", onPress: () => {} },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Profile Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>J</Text>
        </View>
        <View style={styles.avatarBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
        </View>
      </View>

      {/* QR Card */}
      <View style={styles.qrCard}>
        <Text style={styles.userName}>Jordan Williams</Text>
        <Text style={styles.userHandle}>ConnectWorld AI contact</Text>

        {/* QR Code */}
        <View style={styles.qrWrapper}>
          {scanMode ? (
            <View style={styles.scanningOverlay}>
              <Ionicons name="scan" size={64} color={Colors.secondary} />
              <Text style={styles.scanningText}>Scanning...</Text>
            </View>
          ) : (
            <QRCodeVisual />
          )}
        </View>

        {/* What scanning does */}
        <View style={styles.infoRow}>
          <Ionicons name="person-add" size={14} color={Colors.secondary} />
          <Text style={styles.infoText}>Auto-follows & saves contact</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>
        Your QR code is private. If you share it with someone, they can scan it with ConnectWorld AI to{" "}
        <Text style={styles.descHighlight}>automatically follow you</Text> and{" "}
        <Text style={styles.descHighlight}>save your contact info</Text>.
      </Text>

      {/* What gets shared */}
      <View style={styles.sharedInfoCard}>
        <Text style={styles.sharedInfoTitle}>When scanned, they receive:</Text>
        <View style={styles.sharedInfoRow}>
          <Ionicons name="person" size={14} color={Colors.textSecondary} />
          <Text style={styles.sharedInfoText}>Your name & profile photo</Text>
        </View>
        <View style={styles.sharedInfoRow}>
          <Ionicons name="mail" size={14} color={Colors.textSecondary} />
          <Text style={styles.sharedInfoText}>Your email (if enabled)</Text>
        </View>
        <View style={styles.sharedInfoRow}>
          <Ionicons name="language" size={14} color={Colors.textSecondary} />
          <Text style={styles.sharedInfoText}>Your languages (Spanish, English)</Text>
        </View>
        <View style={styles.sharedInfoRow}>
          <Ionicons name="heart" size={14} color={Colors.textSecondary} />
          <Text style={styles.sharedInfoText}>Auto-follow on ConnectWorld AI</Text>
        </View>
      </View>

      {/* Scan Button */}
      <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
        <Ionicons name="scan" size={20} color={Colors.textPrimary} />
        <Text style={styles.scanButtonText}>Scan</Text>
      </TouchableOpacity>

      {/* Reset QR */}
      <TouchableOpacity style={styles.resetBtn} onPress={handleResetQR}>
        <Text style={styles.resetText}>Reset QR code</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  // Avatar
  avatarContainer: {
    alignItems: "center",
    marginTop: Spacing.md,
    marginBottom: -28,
    zIndex: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: "50%",
    marginRight: -28,
  },
  // QR Card
  qrCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    paddingTop: 40,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userHandle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  qrWrapper: {
    padding: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  scanningOverlay: {
    width: QR_SIZE,
    height: QR_SIZE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  scanningText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.secondary + "15",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
  },
  infoText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "600",
  },
  // Description
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  descHighlight: {
    color: Colors.secondary,
    fontWeight: "600",
  },
  // Shared info card
  sharedInfoCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sharedInfoTitle: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  sharedInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 5,
  },
  sharedInfoText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  // Scan button
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  scanButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  // Reset
  resetBtn: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  resetText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "600",
  },
});
