import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

type PermissionStatus = "undetermined" | "granted" | "denied";

interface PermissionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  required: boolean;
}

const PERMISSIONS: PermissionItem[] = [
  {
    id: "microphone",
    title: "Microphone",
    description: "Required for voice calls with AI teachers, CloudWave conversations, live translation, and pronunciation practice",
    icon: "mic",
    required: true,
  },
  {
    id: "camera",
    title: "Camera",
    description: "Used for virtual classrooms, video calls with teachers, and OCR text scanning",
    icon: "videocam",
    required: false,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Get reminders for scheduled classes, surprise calls from teachers, and streak alerts",
    icon: "notifications",
    required: false,
  },
];

export default function PermissionsSetupScreen() {
  const [statuses, setStatuses] = useState<Record<string, PermissionStatus>>({
    microphone: "undetermined",
    camera: "undetermined",
    notifications: "undetermined",
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const requestMicPermission = useCallback(async (): Promise<PermissionStatus> => {
    if (Platform.OS === "web") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        return "granted";
      } catch {
        return "denied";
      }
    }
    try {
      const ExpoAudio = await import("expo-audio");
      const { granted } = await (ExpoAudio as any).requestRecordingPermissionsAsync();
      return granted ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }, []);

  const requestCameraPermission = useCallback(async (): Promise<PermissionStatus> => {
    if (Platform.OS === "web") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        return "granted";
      } catch {
        return "denied";
      }
    }
    try {
      const ImagePicker = await import("expo-image-picker");
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      return granted ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<PermissionStatus> => {
    if (Platform.OS === "web") {
      try {
        const result = await Notification.requestPermission();
        return result === "granted" ? "granted" : "denied";
      } catch {
        return "denied";
      }
    }
    try {
      const Notifications = await import("expo-notifications");
      const { granted } = await Notifications.requestPermissionsAsync();
      return granted ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }, []);

  const handleRequestPermission = useCallback(async (id: string) => {
    let result: PermissionStatus = "denied";

    switch (id) {
      case "microphone":
        result = await requestMicPermission();
        break;
      case "camera":
        result = await requestCameraPermission();
        break;
      case "notifications":
        result = await requestNotificationPermission();
        break;
    }

    setStatuses((prev) => ({ ...prev, [id]: result }));

    // Move to next permission or finish
    if (currentIndex < PERMISSIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setAllDone(true);
    }
  }, [currentIndex, requestMicPermission, requestCameraPermission, requestNotificationPermission]);

  const handleSkip = useCallback(() => {
    if (currentIndex < PERMISSIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setAllDone(true);
    }
  }, [currentIndex]);

  const handleComplete = useCallback(async () => {
    // Save permission setup status
    await AsyncStorage.setItem("@permissions_setup_complete", "true");
    await AsyncStorage.setItem("@permissions_statuses", JSON.stringify(statuses));

    // Navigate to the next step (placement test or main app)
    const existingLevel = await AsyncStorage.getItem("@cefr_level");
    if (!existingLevel) {
      router.replace("/placement-test" as any);
    } else {
      router.replace("/cloudwave-guide" as any);
    }
  }, [statuses]);

  const handleOpenSettings = useCallback(() => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else if (Platform.OS === "android") {
      Linking.openSettings();
    }
  }, []);

  const currentPermission = PERMISSIONS[currentIndex];
  const currentStatus = statuses[currentPermission?.id];

  if (allDone) {
    const grantedCount = Object.values(statuses).filter((s) => s === "granted").length;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completionContainer}>
          <View style={styles.completionIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={styles.completionTitle}>You're All Set!</Text>
          <Text style={styles.completionSubtitle}>
            {grantedCount === 3
              ? "All permissions granted. You'll get the full ConnectWorld AI experience."
              : `${grantedCount}/3 permissions enabled. You can change these anytime in Settings.`}
          </Text>

          {/* Permission summary */}
          <View style={styles.summaryContainer}>
            {PERMISSIONS.map((perm) => (
              <View key={perm.id} style={styles.summaryRow}>
                <Ionicons
                  name={perm.icon as any}
                  size={20}
                  color={statuses[perm.id] === "granted" ? Colors.success : Colors.textSecondary}
                />
                <Text style={[
                  styles.summaryText,
                  statuses[perm.id] === "granted" && styles.summaryTextGranted,
                ]}>
                  {perm.title}
                </Text>
                <Ionicons
                  name={statuses[perm.id] === "granted" ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={statuses[perm.id] === "granted" ? Colors.success : Colors.error}
                />
              </View>
            ))}
          </View>

          {grantedCount < 3 && (
            <TouchableOpacity style={styles.settingsButton} onPress={handleOpenSettings}>
              <Ionicons name="settings" size={18} color={Colors.secondary} />
              <Text style={styles.settingsButtonText}>Open Settings to Enable</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
            <Text style={styles.primaryButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Step {currentIndex + 1} of {PERMISSIONS.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / PERMISSIONS.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Permission Card */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconContainer}>
            <Ionicons
              name={currentPermission.icon as any}
              size={56}
              color={Colors.secondary}
            />
          </View>

          <Text style={styles.permissionTitle}>
            Enable {currentPermission.title}
          </Text>
          <Text style={styles.permissionDescription}>
            {currentPermission.description}
          </Text>

          {currentStatus === "denied" && (
            <View style={styles.deniedBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.warning} />
              <Text style={styles.deniedText}>
                Permission denied. You can enable it later in your device settings.
              </Text>
            </View>
          )}

          {/* Use cases */}
          <View style={styles.useCasesContainer}>
            <Text style={styles.useCasesTitle}>Used for:</Text>
            {currentPermission.id === "microphone" && (
              <>
                <UseCaseRow icon="call" text="Voice calls with AI teachers" />
                <UseCaseRow icon="cloud" text="CloudWave voice conversations" />
                <UseCaseRow icon="language" text="Live translation" />
                <UseCaseRow icon="mic" text="Pronunciation practice" />
              </>
            )}
            {currentPermission.id === "camera" && (
              <>
                <UseCaseRow icon="videocam" text="Virtual classroom video" />
                <UseCaseRow icon="people" text="1-on-1 teacher video calls" />
                <UseCaseRow icon="scan" text="OCR text scanning" />
              </>
            )}
            {currentPermission.id === "notifications" && (
              <>
                <UseCaseRow icon="calendar" text="Class schedule reminders" />
                <UseCaseRow icon="call" text="Surprise teacher calls" />
                <UseCaseRow icon="flame" text="Streak & goal alerts" />
                <UseCaseRow icon="chatbubble" text="Teacher messages" />
              </>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleRequestPermission(currentPermission.id)}
          >
            <Ionicons name={currentPermission.icon as any} size={20} color={Colors.primary} />
            <Text style={styles.primaryButtonText}>
              {currentStatus === "denied" ? "Try Again" : `Allow ${currentPermission.title}`}
            </Text>
          </TouchableOpacity>

          {!currentPermission.required && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          )}

          {currentPermission.required && currentStatus === "denied" && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Continue without (limited features)</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function UseCaseRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.useCaseRow}>
      <Ionicons name={icon as any} size={16} color={Colors.secondary} />
      <Text style={styles.useCaseText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: Spacing.xl,
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  permissionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  permissionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  permissionDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  deniedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.warning + "15",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  deniedText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.warning,
    lineHeight: 18,
  },
  useCasesContainer: {
    width: "100%",
    marginTop: Spacing.md,
  },
  useCasesTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  useCaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  useCaseText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  actionsContainer: {
    marginTop: Spacing.xl,
    gap: 12,
    alignItems: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    width: "100%",
  },
  primaryButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  completionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  completionIcon: {
    marginBottom: Spacing.lg,
  },
  completionTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  summaryContainer: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  summaryTextGranted: {
    color: Colors.text,
    fontWeight: "500",
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  settingsButtonText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: "500",
  },
});
