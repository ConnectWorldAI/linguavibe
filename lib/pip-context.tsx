import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type CallType = "voice" | "video" | "hume";

interface PipState {
  active: boolean;
  callType: CallType;
  callerName: string;
  callerAvatar: string;
  duration: number;
  isMuted: boolean;
  isTranslating: boolean;
}

interface PipContextType {
  pipState: PipState;
  minimizeCall: (callType: CallType, callerName: string, callerAvatar: string) => void;
  maximizeCall: () => void;
  endPipCall: () => void;
  toggleMute: () => void;
}

const defaultState: PipState = {
  active: false,
  callType: "voice",
  callerName: "",
  callerAvatar: "",
  duration: 0,
  isMuted: false,
  isTranslating: true,
};

const PipContext = createContext<PipContextType>({
  pipState: defaultState,
  minimizeCall: () => {},
  maximizeCall: () => {},
  endPipCall: () => {},
  toggleMute: () => {},
});

export function usePip() {
  return useContext(PipContext);
}

export function PipProvider({ children }: { children: React.ReactNode }) {
  const [pipState, setPipState] = useState<PipState>(defaultState);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const minimizeCall = useCallback((callType: CallType, callerName: string, callerAvatar: string) => {
    setPipState((prev) => ({
      ...prev,
      active: true,
      callType,
      callerName,
      callerAvatar,
      duration: prev.duration || 0,
    }));
    // Start duration timer
    if (!durationRef.current) {
      durationRef.current = setInterval(() => {
        setPipState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
  }, []);

  const maximizeCall = useCallback(() => {
    setPipState((prev) => ({ ...prev, active: false }));
    if (pipState.callType === "video") {
      router.push("/video-call");
    } else if (pipState.callType === "hume") {
      router.push("/hume-call" as any);
    } else {
      router.push("/voice-call");
    }
  }, [pipState.callType]);

  const endPipCall = useCallback(() => {
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }
    setPipState(defaultState);
  }, []);

  const toggleMute = useCallback(() => {
    setPipState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  return (
    <PipContext.Provider value={{ pipState, minimizeCall, maximizeCall, endPipCall, toggleMute }}>
      {children}
      {pipState.active && <PipOverlay />}
    </PipContext.Provider>
  );
}

function PipOverlay() {
  const { pipState, maximizeCall, endPipCall, toggleMute } = usePip();
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 180, y: 80 })).current;
  const [expanded, setExpanded] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        // Snap to nearest edge
        const currentX = (pan.x as any)._value;
        const snapX = currentX < SCREEN_WIDTH / 2 ? 12 : SCREEN_WIDTH - (expanded ? 200 : 168);
        Animated.spring(pan.x, {
          toValue: snapX,
          useNativeDriver: false,
          friction: 7,
        }).start();
        // Keep within bounds vertically
        const currentY = (pan.y as any)._value;
        const clampedY = Math.max(60, Math.min(currentY, SCREEN_HEIGHT - 200));
        Animated.spring(pan.y, {
          toValue: clampedY,
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    })
  ).current;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Animated.View
      style={[
        styles.pipContainer,
        expanded ? styles.pipExpanded : styles.pipCompact,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Compact View */}
      {!expanded && (
        <TouchableOpacity
          style={styles.pipCompactInner}
          onPress={() => setExpanded(true)}
          activeOpacity={0.9}
        >
          <View style={styles.pipAvatarSmall}>
            <Text style={styles.pipAvatarText}>{pipState.callerAvatar}</Text>
            <View style={styles.pipLiveDot} />
          </View>
          <View style={styles.pipInfoCompact}>
            <Text style={styles.pipNameCompact} numberOfLines={1}>{pipState.callerName}</Text>
            <Text style={styles.pipTimerCompact}>{formatTime(pipState.duration)}</Text>
          </View>
          <View style={styles.pipCallIcon}>
            <Ionicons
              name={pipState.callType === "video" ? "videocam" : "call"}
              size={14}
              color="#00FF88"
            />
          </View>
        </TouchableOpacity>
      )}

      {/* Expanded View */}
      {expanded && (
        <View style={styles.pipExpandedInner}>
          {/* Header */}
          <View style={styles.pipExpandedHeader}>
            <View style={styles.pipLiveIndicator}>
              <View style={styles.pipLivePulse} />
              <Text style={styles.pipLiveText}>LIVE</Text>
            </View>
            <Text style={styles.pipExpandedTimer}>{formatTime(pipState.duration)}</Text>
            <TouchableOpacity onPress={() => setExpanded(false)} style={styles.pipMinBtn}>
              <Ionicons name="remove" size={16} color="#7EB8E0" />
            </TouchableOpacity>
          </View>

          {/* Caller Info */}
          <View style={styles.pipCallerRow}>
            <View style={styles.pipAvatarMed}>
              <Text style={styles.pipAvatarMedText}>{pipState.callerAvatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pipCallerName}>{pipState.callerName}</Text>
              <Text style={styles.pipCallerType}>
                {pipState.callType === "video" ? "Video Call" : "Voice Call"} • WiFi
              </Text>
            </View>
          </View>

          {/* Translation indicator */}
          {pipState.isTranslating && (
            <View style={styles.pipTranslation}>
              <Ionicons name="language" size={12} color="#00AAFF" />
              <Text style={styles.pipTranslationText}>Live translation active</Text>
            </View>
          )}

          {/* Controls */}
          <View style={styles.pipControls}>
            <TouchableOpacity style={styles.pipControlBtn} onPress={toggleMute}>
              <Ionicons
                name={pipState.isMuted ? "mic-off" : "mic"}
                size={18}
                color={pipState.isMuted ? "#FF2D2D" : "#FFFFFF"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.pipMaxBtn} onPress={maximizeCall}>
              <Ionicons name="expand" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.pipEndBtn} onPress={endPipCall}>
              <Ionicons name="call" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pipContainer: {
    position: "absolute",
    zIndex: 9999,
    elevation: 9999,
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  pipCompact: {
    width: 156,
    height: 52,
    borderRadius: 26,
  },
  pipExpanded: {
    width: 188,
    borderRadius: 16,
  },
  pipCompactInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(13, 21, 37, 0.97)",
    borderRadius: 26,
    paddingHorizontal: 6,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "rgba(0, 170, 255, 0.50)",
  },
  pipAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pipAvatarText: { fontSize: 18 },
  pipLiveDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00FF88",
    borderWidth: 2,
    borderColor: "#0D1525",
  },
  pipInfoCompact: { flex: 1 },
  pipNameCompact: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  pipTimerCompact: { fontSize: 10, color: "#7EB8E0", marginTop: 1 },
  pipCallIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 255, 136, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.40)",
  },

  // Expanded
  pipExpandedInner: {
    backgroundColor: "rgba(13, 21, 37, 0.97)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "rgba(0, 170, 255, 0.50)",
  },
  pipExpandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  pipLiveIndicator: { flexDirection: "row", alignItems: "center", gap: 4 },
  pipLivePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF2D2D" },
  pipLiveText: { fontSize: 9, fontWeight: "800", color: "#FF2D2D", letterSpacing: 0.5 },
  pipExpandedTimer: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  pipMinBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(126, 184, 224, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  pipCallerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  pipAvatarMed: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.30)",
  },
  pipAvatarMedText: { fontSize: 20 },
  pipCallerName: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  pipCallerType: { fontSize: 10, color: "#7EB8E0", marginTop: 2 },
  pipTranslation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.20)",
  },
  pipTranslationText: { fontSize: 10, color: "#00AAFF", fontWeight: "500" },
  pipControls: { flexDirection: "row", justifyContent: "center", gap: 12 },
  pipControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  pipMaxBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 170, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.40)",
  },
  pipEndBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF2D2D",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "135deg" }],
  },
});
