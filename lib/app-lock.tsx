import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";

const LOCK_ENABLED_KEY = "@linguavibe_app_lock_enabled";
const LOCK_TIMEOUT_KEY = "@linguavibe_app_lock_timeout";

type AppLockContextType = {
  isLockEnabled: boolean;
  isLocked: boolean;
  lockTimeout: number; // seconds
  biometricType: string | null;
  toggleLock: () => Promise<void>;
  setLockTimeout: (seconds: number) => Promise<void>;
  unlock: () => Promise<boolean>;
};

const AppLockContext = createContext<AppLockContextType>({
  isLockEnabled: false,
  isLocked: false,
  lockTimeout: 0,
  biometricType: null,
  toggleLock: async () => {},
  setLockTimeout: async () => {},
  unlock: async () => false,
});

export function useAppLock() {
  return useContext(AppLockContext);
}

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeout, setLockTimeoutState] = useState(0); // 0 = immediate
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [lastBackground, setLastBackground] = useState(0);

  useEffect(() => {
    loadSettings();
    checkBiometricType();
  }, []);

  // Monitor app state for lock on background
  useEffect(() => {
    if (Platform.OS === "web") return;

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        setLastBackground(Date.now());
      } else if (state === "active" && isLockEnabled) {
        const elapsed = (Date.now() - lastBackground) / 1000;
        if (elapsed > lockTimeout) {
          setIsLocked(true);
        }
      }
    });

    return () => subscription.remove();
  }, [isLockEnabled, lockTimeout, lastBackground]);

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem(LOCK_ENABLED_KEY);
      const timeout = await AsyncStorage.getItem(LOCK_TIMEOUT_KEY);
      if (enabled === "true") {
        setIsLockEnabled(true);
        // Lock on first launch if enabled
        setIsLocked(true);
      }
      if (timeout) setLockTimeoutState(parseInt(timeout, 10));
    } catch {}
  };

  const checkBiometricType = async () => {
    if (Platform.OS === "web") {
      setBiometricType(null);
      return;
    }
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("Face ID");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("Fingerprint");
      } else {
        setBiometricType(null);
      }
    } catch {
      setBiometricType(null);
    }
  };

  const toggleLock = useCallback(async () => {
    if (Platform.OS === "web") {
      // On web, just toggle the setting without biometric check
      const newValue = !isLockEnabled;
      setIsLockEnabled(newValue);
      await AsyncStorage.setItem(LOCK_ENABLED_KEY, newValue.toString());
      return;
    }

    if (!isLockEnabled) {
      // Enabling - verify biometrics first
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) return;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify to enable App Lock",
      });
      if (result.success) {
        setIsLockEnabled(true);
        await AsyncStorage.setItem(LOCK_ENABLED_KEY, "true");
      }
    } else {
      // Disabling
      setIsLockEnabled(false);
      setIsLocked(false);
      await AsyncStorage.setItem(LOCK_ENABLED_KEY, "false");
    }
  }, [isLockEnabled]);

  const setLockTimeout = useCallback(async (seconds: number) => {
    setLockTimeoutState(seconds);
    await AsyncStorage.setItem(LOCK_TIMEOUT_KEY, seconds.toString());
  }, []);

  const unlock = useCallback(async () => {
    if (Platform.OS === "web") {
      setIsLocked(false);
      return true;
    }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock LinguaVibe",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (result.success) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <AppLockContext.Provider
      value={{ isLockEnabled, isLocked, lockTimeout, biometricType, toggleLock, setLockTimeout, unlock }}
    >
      {children}
      {isLocked && <LockScreen onUnlock={unlock} biometricType={biometricType} />}
    </AppLockContext.Provider>
  );
}

function LockScreen({ onUnlock, biometricType }: { onUnlock: () => Promise<boolean>; biometricType: string | null }) {
  const [error, setError] = useState("");

  const handleUnlock = async () => {
    const success = await onUnlock();
    if (!success) {
      setError("Authentication failed. Try again.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Auto-prompt on mount
  useEffect(() => {
    const timer = setTimeout(handleUnlock, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={lockStyles.container}>
      <View style={lockStyles.content}>
        {/* Logo / Brand */}
        <View style={lockStyles.iconContainer}>
          <View style={lockStyles.iconGlow} />
          <Ionicons name="lock-closed" size={40} color="#00AAFF" />
        </View>

        <Text style={lockStyles.title}>LinguaVibe</Text>
        <Text style={lockStyles.subtitle}>
          {biometricType ? `Use ${biometricType} to unlock` : "Tap to unlock"}
        </Text>

        {error ? <Text style={lockStyles.error}>{error}</Text> : null}

        <TouchableOpacity style={lockStyles.unlockBtn} onPress={handleUnlock} activeOpacity={0.8}>
          <Ionicons
            name={biometricType === "Face ID" ? "scan" : "finger-print"}
            size={24}
            color="#FFFFFF"
          />
          <Text style={lockStyles.unlockBtnText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const lockStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0A0E1A",
    zIndex: 99999,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { alignItems: "center", gap: 16 },
  iconContainer: { position: "relative", marginBottom: 10 },
  iconGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,170,255,0.15)",
    top: -20,
    left: -20,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#FFFFFF" },
  subtitle: { fontSize: 15, color: "#8A9BB0" },
  error: { fontSize: 13, color: "#FF6B6B", marginTop: 8 },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#00AAFF",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 20,
  },
  unlockBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
