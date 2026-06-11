import React, { useState, useRef, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Scanning interval in ms (how often we capture + OCR)
const SCAN_INTERVAL = 2500;

type TranslationOverlay = {
  id: string;
  originalText: string;
  translatedText: string;
  timestamp: number;
};

export default function LiveARCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [overlays, setOverlays] = useState<TranslationOverlay[]>([]);
  const [currentDetection, setCurrentDetection] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fromLang, setFromLang] = useState("Auto-Detect");
  const [toLang, setToLang] = useState("English");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [savedHistory, setSavedHistory] = useState<TranslationOverlay[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load history and favorites on mount
  useEffect(() => {
    (async () => {
      try {
        const hist = await AsyncStorage.getItem("@ar_scan_history");
        const favs = await AsyncStorage.getItem("@ar_scan_favorites");
        if (hist) setSavedHistory(JSON.parse(hist));
        if (favs) setFavorites(new Set(JSON.parse(favs)));
      } catch {}
    })();
  }, []);

  // Save a scan to history
  const saveToHistory = useCallback(async (overlay: TranslationOverlay) => {
    const updated = [overlay, ...savedHistory].slice(0, 100); // Keep last 100
    setSavedHistory(updated);
    await AsyncStorage.setItem("@ar_scan_history", JSON.stringify(updated));
  }, [savedHistory]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: string) => {
    const updated = new Set(favorites);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setFavorites(updated);
    await AsyncStorage.setItem("@ar_scan_favorites", JSON.stringify([...updated]));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [favorites]);

  // Clear all history
  const clearHistory = useCallback(async () => {
    setSavedHistory([]);
    setFavorites(new Set());
    await AsyncStorage.removeItem("@ar_scan_history");
    await AsyncStorage.removeItem("@ar_scan_favorites");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const cameraRef = useRef<CameraView>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // tRPC mutations
  const ocrMutation = trpc.translate.ocr.useMutation();
  const translateMutation = trpc.translate.text.useMutation();

  // Pulse animation for scanning indicator
  useEffect(() => {
    if (isScanning && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isScanning, isPaused]);

  // Start continuous scanning
  const startScanning = useCallback(() => {
    if (Platform.OS === "web") {
      // On web, camera capture is limited
      setIsScanning(true);
      return;
    }
    setIsScanning(true);
    setIsPaused(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Capture and process at regular intervals
    scanIntervalRef.current = setInterval(async () => {
      if (isPaused || isProcessing) return;
      await captureAndTranslate();
    }, SCAN_INTERVAL);
  }, [isPaused, isProcessing]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Pause/resume
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Capture frame and run OCR + translation
  const captureAndTranslate = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);

      // Take a photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true,
      });

      if (!photo?.base64) {
        setIsProcessing(false);
        return;
      }

      // Run OCR
      const ocrResult = await ocrMutation.mutateAsync({
        base64Image: photo.base64,
        mimeType: "image/jpeg",
      });

      if (!ocrResult.success || !ocrResult.text.trim()) {
        setCurrentDetection("");
        setIsProcessing(false);
        return;
      }

      const detectedText = ocrResult.text.trim();
      setCurrentDetection(detectedText);

      // Translate
      const translateResult = await translateMutation.mutateAsync({
        text: detectedText,
        fromLanguage: fromLang === "Auto-Detect" ? "auto" : fromLang,
        toLanguage: toLang,
      });

      if (translateResult.translation) {
        const newOverlay: TranslationOverlay = {
          id: `overlay-${Date.now()}`,
          originalText: detectedText.substring(0, 100),
          translatedText: translateResult.translation.substring(0, 200),
          timestamp: Date.now(),
        };

        setOverlays((prev) => {
          // Keep only last 5 overlays
          const updated = [...prev, newOverlay];
          return updated.slice(-5);
        });
        setScanCount((c) => c + 1);
        // Auto-save to history
        saveToHistory(newOverlay);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("AR Camera error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, fromLang, toLang]);

  // Manual capture (tap to scan)
  const handleManualCapture = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await captureAndTranslate();
  }, [captureAndTranslate]);

  // Clear overlays
  const clearOverlays = useCallback(() => {
    setOverlays([]);
    setCurrentDetection("");
    setScanCount(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Permission handling
  if (!permission) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
        <View style={styles.centerContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.secondary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Point your camera at signs, menus, or any text to see instant translations overlaid on screen.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Preview */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        enableTorch={flashEnabled}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.languageBar}>
            <Text style={styles.langText}>{fromLang}</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.secondary} />
            <Text style={styles.langText}>{toLang}</Text>
          </View>

          <TouchableOpacity
            style={styles.topButton}
            onPress={() => {
              setFlashEnabled(!flashEnabled);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name={flashEnabled ? "flash" : "flash-off"} size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topButton}
            onPress={() => {
              setShowHistory(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name="time" size={24} color="#FFF" />
            {savedHistory.length > 0 && (
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>{savedHistory.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Scanning Frame */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Scanning indicator */}
          {isScanning && !isPaused && (
            <Animated.View style={[styles.scanLine, { transform: [{ scaleX: pulseAnim }] }]} />
          )}
        </View>

        {/* Translation Overlays */}
        {overlays.length > 0 && (
          <View style={styles.overlayContainer}>
            {overlays.slice(-3).map((overlay, index) => (
              <View key={overlay.id} style={[styles.overlayBubble, { opacity: 0.7 + index * 0.1 }]}>
                <Text style={styles.overlayOriginal} numberOfLines={1}>
                  {overlay.originalText}
                </Text>
                <Text style={styles.overlayTranslated} numberOfLines={2}>
                  {overlay.translation}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingBadge}>
            <ActivityIndicator size="small" color={Colors.secondary} />
            <Text style={styles.processingText}>Translating...</Text>
          </View>
        )}

        {/* Current Detection */}
        {currentDetection && !isProcessing && (
          <View style={styles.detectionBadge}>
            <Ionicons name="text" size={14} color={Colors.secondary} />
            <Text style={styles.detectionText} numberOfLines={1}>
              {currentDetection.substring(0, 50)}
            </Text>
          </View>
        )}
      </CameraView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            <Ionicons name="scan" size={12} color={Colors.secondary} /> {scanCount} scans
          </Text>
          <Text style={styles.statText}>
            {isScanning ? (isPaused ? "PAUSED" : "LIVE") : "READY"}
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlRow}>
          {/* Clear */}
          <TouchableOpacity style={styles.sideButton} onPress={clearOverlays}>
            <Ionicons name="trash-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Main Button: Start/Stop or Manual Capture */}
          {isScanning ? (
            <View style={styles.mainButtonGroup}>
              <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
                <Ionicons name={isPaused ? "play" : "pause"} size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopButton} onPress={stopScanning}>
                <View style={styles.stopSquare} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.mainButtonGroup}>
              <TouchableOpacity style={styles.captureButton} onPress={handleManualCapture}>
                <Ionicons name="scan" size={28} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.autoButton} onPress={startScanning}>
                <Ionicons name="repeat" size={16} color={Colors.secondary} />
                <Text style={styles.autoButtonText}>Auto</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Language swap */}
          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => {
              if (fromLang !== "Auto-Detect") {
                const temp = fromLang;
                setFromLang(toLang);
                setToLang(temp);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Ionicons name="swap-horizontal" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Language Selector Pills */}
        <View style={styles.langPills}>
          <TouchableOpacity
            style={styles.langPill}
            onPress={() => {
              const langs = ["Auto-Detect", "English", "Spanish", "French", "Japanese", "Korean", "German"];
              const idx = langs.indexOf(fromLang);
              setFromLang(langs[(idx + 1) % langs.length]);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.langPillText}>{fromLang}</Text>
            <Ionicons name="chevron-down" size={12} color={Colors.textSecondary} />
          </TouchableOpacity>

          <Ionicons name="arrow-forward" size={16} color={Colors.secondary} />

          <TouchableOpacity
            style={styles.langPill}
            onPress={() => {
              const langs = ["English", "Spanish", "French", "Japanese", "Korean", "German", "Italian"];
              const idx = langs.indexOf(toLang);
              setToLang(langs[(idx + 1) % langs.length]);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.langPillText}>{toLang}</Text>
            <Ionicons name="chevron-down" size={12} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* History Panel */}
      {showHistory && (
        <View style={styles.historyOverlay}>
          <View style={styles.historyPanel}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Scan History</Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {savedHistory.length > 0 && (
                  <TouchableOpacity onPress={clearHistory}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {savedHistory.length === 0 ? (
              <View style={styles.historyEmpty}>
                <Ionicons name="scan-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.historyEmptyText}>No scans yet</Text>
                <Text style={styles.historyEmptySubtext}>Point your camera at text to start scanning</Text>
              </View>
            ) : (
              <FlatList
                data={savedHistory}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.historyItem}>
                    <View style={styles.historyItemContent}>
                      <Text style={styles.historyOriginal} numberOfLines={2}>{item.originalText}</Text>
                      <Text style={styles.historyTranslated} numberOfLines={2}>{item.translation}</Text>
                      <Text style={styles.historyTime}>
                        {new Date(item.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() => toggleFavorite(item.id)}
                    >
                      <Ionicons
                        name={favorites.has(item.id) ? "heart" : "heart-outline"}
                        size={22}
                        color={favorites.has(item.id) ? Colors.error : Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.primary,
  },
  camera: {
    flex: 1,
  },
  // Permission UI
  permissionTitle: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  permissionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  permissionButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#FFF",
  },
  backLink: {
    marginTop: Spacing.lg,
  },
  backLinkText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  // Top Bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: Spacing.md,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  languageBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  langText: {
    fontSize: FontSize.sm,
    color: "#FFF",
    fontWeight: "600",
  },
  // Scan Frame
  scanFrame: {
    position: "absolute",
    top: "25%",
    left: "10%",
    right: "10%",
    bottom: "35%",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: Colors.secondary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    width: "80%",
    height: 2,
    backgroundColor: Colors.secondary,
    opacity: 0.7,
  },
  // Overlays
  overlayContainer: {
    position: "absolute",
    bottom: "30%",
    left: Spacing.lg,
    right: Spacing.lg,
    gap: 8,
  },
  overlayBubble: {
    backgroundColor: "rgba(4, 8, 16, 0.88)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  overlayOriginal: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  overlayTranslated: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: "700",
  },
  // Processing
  processingBadge: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  processingText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "600",
  },
  // Detection badge
  detectionBadge: {
    position: "absolute",
    top: "20%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  detectionText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
  },
  // Bottom Controls
  bottomControls: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === "ios" ? 34 : Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mainButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  captureButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  autoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  autoButtonText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "600",
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  stopSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  // Language pills
  langPills: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langPillText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  // History panel styles
  historyBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  historyBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFF",
  },
  historyOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  historyPanel: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  historyTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  historyEmpty: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: 8,
  },
  historyEmptyText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  historyEmptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyItemContent: {
    flex: 1,
    gap: 4,
  },
  historyOriginal: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  historyTranslated: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  historyTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
