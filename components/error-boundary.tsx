import React, { Component, type ErrorInfo, type ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BrandName } from "@/components/brand-name";
import { reportCrash } from "@/lib/crash-analytics";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional: screen-level boundary shows a smaller inline fallback */
  level?: "root" | "screen";
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ─── Error Boundary Component ────────────────────────────────────────────────
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log error for debugging
    console.error("[ErrorBoundary] Caught error:", error.message);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);

    // Report to crash analytics service
    reportCrash(error, {
      componentStack: errorInfo.componentStack ?? undefined,
      level: this.props.level ?? "root",
    }).catch(() => {
      // Silently fail — crash reporting should never crash the app
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isScreenLevel = this.props.level === "screen";

      if (isScreenLevel) {
        return (
          <View style={styles.screenContainer}>
            <View style={styles.screenContent}>
              <MaterialIcons name="error-outline" size={36} color="#F59E0B" />
              <Text style={styles.screenTitle}>Screen Error</Text>
              <Text style={styles.screenSubtitle}>
                This section encountered an issue.
              </Text>
              <TouchableOpacity
                style={styles.screenRetryBtn}
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <MaterialIcons name="refresh" size={18} color="#fff" />
                <Text style={styles.screenRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.container}>
          {/* Gradient-like layered background */}
          <View style={styles.gradientLayer1} />
          <View style={styles.gradientLayer2} />

          <View style={styles.content}>
            {/* Neon glow ring */}
            <View style={styles.glowRing}>
              <View style={styles.iconWrap}>
                <MaterialIcons name="wifi-off" size={40} color="#F59E0B" />
              </View>
            </View>

            {/* Brand text */}
            <BrandName size="sm" color="rgba(0, 170, 255, 0.7)" aiColor="rgba(0, 170, 255, 0.7)" />

            {/* Title */}
            <Text style={styles.title}>Something Went Wrong</Text>
            <Text style={styles.subtitle}>
              The app encountered an unexpected error.{"\n"}
              Don't worry — your progress is safe.
            </Text>

            {/* Error Details (dev only) */}
            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorBox} contentContainerStyle={{ padding: 12 }}>
                <Text style={styles.errorTitle}>Debug Info</Text>
                <Text style={styles.errorText}>{this.state.error.message}</Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.stackText}>
                    {this.state.errorInfo.componentStack.slice(0, 500)}
                  </Text>
                )}
              </ScrollView>
            )}

            {/* Retry Button */}
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={this.handleRetry}
              activeOpacity={0.8}
            >
              <MaterialIcons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>

            {/* Help text */}
            <Text style={styles.helpText}>
              If this keeps happening, try closing and reopening the app.
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// ─── Screen-Level Error Boundary Wrapper ─────────────────────────────────────
export function ScreenErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="screen">{children}</ErrorBoundary>;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Root-level styles
  container: {
    flex: 1,
    backgroundColor: "#040810",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  gradientLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#060912",
    opacity: 0.9,
  },
  gradientLayer2: {
    position: "absolute",
    top: "20%",
    left: "-20%",
    width: "140%",
    height: "60%",
    borderRadius: 300,
    backgroundColor: "rgba(0, 100, 200, 0.06)",
  },
  content: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    zIndex: 1,
  },
  glowRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(245, 158, 11, 0.05)",
    borderWidth: 2,
    borderColor: "rgba(245, 158, 11, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 0 30px rgba(245, 158, 11, 0.3)" } as any)
      : {}),
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(0, 170, 255, 0.7)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ECEDEE",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#9BA1A6",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  errorBox: {
    width: "100%",
    maxHeight: 140,
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F87171",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  errorText: {
    fontSize: 11,
    color: "#F87171",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 8,
  },
  stackText: {
    fontSize: 10,
    color: "#9BA1A6",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0088FF",
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
    width: "100%",
    marginBottom: 16,
    shadowColor: "#0088FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 4px 20px rgba(0, 136, 255, 0.3)" } as any)
      : {}),
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  helpText: {
    fontSize: 12,
    color: "#687076",
    textAlign: "center",
  },

  // Screen-level styles (compact inline fallback)
  screenContainer: {
    flex: 1,
    backgroundColor: "#0D1117",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  screenContent: {
    alignItems: "center",
    gap: 10,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ECEDEE",
    marginTop: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: "#9BA1A6",
    textAlign: "center",
    marginBottom: 8,
  },
  screenRetryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0088FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  screenRetryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
