/**
 * Admin Portal Screen
 * 
 * Hidden admin access panel. Enter PIN to activate admin mode.
 * Admin gets:
 * - Onboarding bypass
 * - Real-cost API access (no pricing tier markup)
 * - Enterprise-level feature access
 * - Testing tools
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, Switch, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/Colors";
import {
  getAdminState, activateAdminAccess, deactivateAdminAccess,
  toggleOnboardingBypass, toggleRealCostMode, type AdminState,
} from "@/lib/admin-access";

export default function AdminPortalScreen() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [adminState, setAdminState] = useState<AdminState>({
    isAdmin: false, canBypassOnboarding: false, realCostMode: false, activatedAt: null,
  });
  const [showPin, setShowPin] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    loadAdminState();
  }, []);

  const loadAdminState = async () => {
    const state = await getAdminState();
    setAdminState(state);
  };

  const handleActivate = async () => {
    if (!pin.trim()) return;
    const success = await activateAdminAccess(pin.trim());
    if (success) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPin("");
      await loadAdminState();
      Alert.alert("Admin Activated", "You now have full admin access with real-cost billing and onboarding bypass.");
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAttempts((a) => a + 1);
      if (attempts >= 4) {
        Alert.alert("Access Denied", "Too many failed attempts. Please try again later.");
      } else {
        Alert.alert("Invalid PIN", "The admin PIN is incorrect.");
      }
    }
  };

  const handleDeactivate = () => {
    Alert.alert("Deactivate Admin", "This will remove admin access and reset to free plan.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate", style: "destructive",
        onPress: async () => {
          await deactivateAdminAccess();
          await loadAdminState();
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleToggleBypass = async (val: boolean) => {
    await toggleOnboardingBypass(val);
    setAdminState((s) => ({ ...s, canBypassOnboarding: val }));
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleRealCost = async (val: boolean) => {
    await toggleRealCostMode(val);
    setAdminState((s) => ({ ...s, realCostMode: val }));
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Admin Portal</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {!adminState.isAdmin ? (
          /* ─── PIN Entry ─── */
          <View style={s.pinSection}>
            <View style={s.lockIcon}>
              <Ionicons name="lock-closed" size={48} color={Colors.neonPurple} />
            </View>
            <Text style={s.pinTitle}>Admin Access Required</Text>
            <Text style={s.pinSubtitle}>
              Enter your admin PIN to activate admin mode.{"\n"}
              This gives you real-cost access and testing tools.
            </Text>

            <View style={s.pinInputRow}>
              <TextInput
                style={s.pinInput}
                value={pin}
                onChangeText={setPin}
                placeholder="Enter admin PIN"
                placeholderTextColor={Colors.muted}
                secureTextEntry={!showPin}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleActivate}
              />
              <Pressable onPress={() => setShowPin(!showPin)} style={s.eyeBtn}>
                <Ionicons name={showPin ? "eye-off" : "eye"} size={20} color={Colors.muted} />
              </Pressable>
            </View>

            <Pressable
              onPress={handleActivate}
              style={({ pressed }) => [s.activateBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            >
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={s.activateBtnText}>Activate Admin</Text>
            </Pressable>

            {attempts > 0 && (
              <Text style={s.attemptText}>{attempts} failed attempt{attempts > 1 ? "s" : ""}</Text>
            )}
          </View>
        ) : (
          /* ─── Admin Controls ─── */
          <>
            {/* Status card */}
            <View style={s.statusCard}>
              <View style={s.statusHeader}>
                <View style={s.adminBadge}>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                </View>
                <View style={s.statusInfo}>
                  <Text style={s.statusTitle}>Admin Mode Active</Text>
                  <Text style={s.statusSubtitle}>
                    Since {adminState.activatedAt ? new Date(adminState.activatedAt).toLocaleDateString() : "now"}
                  </Text>
                </View>
              </View>
              <Text style={s.statusDesc}>
                You have full access to all features at real cost. No pricing tier markup applied.
                Your account operates as the app administrator.
              </Text>
            </View>

            {/* Controls */}
            <View style={s.controlsSection}>
              <Text style={s.sectionTitle}>Admin Controls</Text>

              <View style={s.controlRow}>
                <View style={s.controlInfo}>
                  <Ionicons name="rocket" size={20} color={Colors.accent} />
                  <View style={s.controlText}>
                    <Text style={s.controlLabel}>Onboarding Bypass</Text>
                    <Text style={s.controlDesc}>Skip onboarding flow for testing</Text>
                  </View>
                </View>
                <Switch
                  value={adminState.canBypassOnboarding}
                  onValueChange={handleToggleBypass}
                  trackColor={{ false: Colors.borderLight, true: Colors.accent + "60" }}
                  thumbColor={adminState.canBypassOnboarding ? Colors.accent : Colors.muted}
                />
              </View>

              <View style={s.controlRow}>
                <View style={s.controlInfo}>
                  <Ionicons name="cash" size={20} color={Colors.success} />
                  <View style={s.controlText}>
                    <Text style={s.controlLabel}>Real-Cost Mode</Text>
                    <Text style={s.controlDesc}>API calls at actual cost, no markup</Text>
                  </View>
                </View>
                <Switch
                  value={adminState.realCostMode}
                  onValueChange={handleToggleRealCost}
                  trackColor={{ false: Colors.borderLight, true: Colors.success + "60" }}
                  thumbColor={adminState.realCostMode ? Colors.success : Colors.muted}
                />
              </View>

              <View style={s.controlRow}>
                <View style={s.controlInfo}>
                  <Ionicons name="diamond" size={20} color={Colors.gold} />
                  <View style={s.controlText}>
                    <Text style={s.controlLabel}>Subscription Level</Text>
                    <Text style={s.controlDesc}>Enterprise (all features unlocked)</Text>
                  </View>
                </View>
                <View style={s.enterpriseBadge}>
                  <Text style={s.enterpriseText}>Enterprise</Text>
                </View>
              </View>
            </View>

            {/* Quick links */}
            <View style={s.controlsSection}>
              <Text style={s.sectionTitle}>Quick Access</Text>
              {[
                { icon: "construct" as const, label: "Knowledge Base", route: "/admin-knowledge-base" },
                { icon: "terminal" as const, label: "Command Center", route: "/admin-command-center" },
                { icon: "analytics" as const, label: "Usage Dashboard", route: "/usage-dashboard" },
                { icon: "chatbubbles" as const, label: "Conversation History", route: "/conversation-history" },
                { icon: "journal" as const, label: "Student Journal", route: "/student-journal" },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.route as any)}
                  style={({ pressed }) => [s.quickLink, pressed && { opacity: 0.7 }]}
                >
                  <Ionicons name={item.icon} size={18} color={Colors.accent} />
                  <Text style={s.quickLinkText}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
                </Pressable>
              ))}
            </View>

            {/* Guardrail info */}
            <View style={s.guardrailCard}>
              <Ionicons name="information-circle" size={20} color={Colors.warning} />
              <Text style={s.guardrailText}>
                <Text style={{ fontWeight: "700" }}>Onboarding Guardrail: </Text>
                When the app is deployed and final, all regular users MUST complete onboarding.
                Only admin accounts (verified via PIN) can bypass this requirement.
                Wave Cloud cannot skip past onboarding for any non-admin user.
              </Text>
            </View>

            {/* Deactivate */}
            <Pressable
              onPress={handleDeactivate}
              style={({ pressed }) => [s.deactivateBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="close-circle" size={18} color={Colors.error} />
              <Text style={s.deactivateText}>Deactivate Admin Access</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  content: { padding: Spacing.md, paddingBottom: 100 },
  pinSection: { alignItems: "center", paddingTop: 40 },
  lockIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.neonPurple + "15",
    alignItems: "center", justifyContent: "center", marginBottom: Spacing.md,
  },
  pinTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginBottom: 8 },
  pinSubtitle: { fontSize: FontSize.sm, color: Colors.muted, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  pinInputRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, borderWidth: 0.5, borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm, width: "100%", maxWidth: 320,
  },
  pinInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: 14 },
  eyeBtn: { padding: 8 },
  activateBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.neonPurple,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: BorderRadius.lg, marginTop: 16,
  },
  activateBtnText: { fontSize: FontSize.base, fontWeight: "700", color: "#fff" },
  attemptText: { fontSize: FontSize.xs, color: Colors.error, marginTop: 12 },
  statusCard: {
    backgroundColor: Colors.neonPurple + "10", borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 0.5, borderColor: Colors.neonPurple + "30",
  },
  statusHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: 8 },
  adminBadge: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.neonPurple,
    alignItems: "center", justifyContent: "center",
  },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: FontSize.base, fontWeight: "700", color: Colors.textPrimary },
  statusSubtitle: { fontSize: FontSize.xs, color: Colors.muted },
  statusDesc: { fontSize: FontSize.sm, color: Colors.secondaryText, lineHeight: 20 },
  controlsSection: { marginTop: Spacing.lg },
  sectionTitle: { fontSize: FontSize.base, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.sm },
  controlRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md,
    marginBottom: 8, borderWidth: 0.5, borderColor: Colors.borderLight,
  },
  controlInfo: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flex: 1 },
  controlText: { flex: 1 },
  controlLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  controlDesc: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 1 },
  enterpriseBadge: {
    backgroundColor: Colors.gold + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  enterpriseText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.gold },
  quickLink: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md,
    marginBottom: 6, borderWidth: 0.5, borderColor: Colors.borderLight,
  },
  quickLinkText: { flex: 1, fontSize: FontSize.sm, fontWeight: "500", color: Colors.textPrimary },
  guardrailCard: {
    flexDirection: "row", gap: Spacing.sm, backgroundColor: Colors.warning + "10",
    borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.lg,
    borderWidth: 0.5, borderColor: Colors.warning + "30",
  },
  guardrailText: { flex: 1, fontSize: FontSize.xs, color: Colors.secondaryText, lineHeight: 18 },
  deactivateBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, marginTop: Spacing.lg,
  },
  deactivateText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.error },
});
