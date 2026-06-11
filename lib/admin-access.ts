/**
 * Admin Access Module
 * 
 * Provides admin account functionality:
 * - Admin PIN verification (hidden in settings)
 * - Onboarding bypass for admin accounts
 * - Real-cost access (no pricing tier markup)
 * - Feature access without subscription gating
 * 
 * SECURITY: Admin PIN is stored locally. Once the app is deployed
 * and final, the onboarding guardrail ensures no one can skip
 * onboarding unless they have admin access.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const ADMIN_KEY = "@admin_access_enabled";
const ADMIN_PIN_KEY = "@admin_pin_hash";
const ADMIN_BYPASS_KEY = "@admin_onboarding_bypass";
const ADMIN_REAL_COST_KEY = "@admin_real_cost_mode";

// Default admin PIN — change this in production
// This is a simple hash check, not cryptographic security
const DEFAULT_ADMIN_PIN = "linguavibe2026";

export interface AdminState {
  isAdmin: boolean;
  canBypassOnboarding: boolean;
  realCostMode: boolean;
  activatedAt: string | null;
}

/**
 * Check if the current device has admin access enabled
 */
export async function getAdminState(): Promise<AdminState> {
  try {
    const isAdmin = await AsyncStorage.getItem(ADMIN_KEY);
    const bypass = await AsyncStorage.getItem(ADMIN_BYPASS_KEY);
    const realCost = await AsyncStorage.getItem(ADMIN_REAL_COST_KEY);
    return {
      isAdmin: isAdmin === "true",
      canBypassOnboarding: bypass === "true",
      realCostMode: realCost === "true",
      activatedAt: isAdmin === "true" ? (await AsyncStorage.getItem("@admin_activated_at")) : null,
    };
  } catch {
    return { isAdmin: false, canBypassOnboarding: false, realCostMode: false, activatedAt: null };
  }
}

/**
 * Verify admin PIN and activate admin access
 */
export async function activateAdminAccess(pin: string): Promise<boolean> {
  if (pin === DEFAULT_ADMIN_PIN) {
    await AsyncStorage.setItem(ADMIN_KEY, "true");
    await AsyncStorage.setItem(ADMIN_BYPASS_KEY, "true");
    await AsyncStorage.setItem(ADMIN_REAL_COST_KEY, "true");
    await AsyncStorage.setItem("@admin_activated_at", new Date().toISOString());
    // Set subscription to enterprise level for admin
    await AsyncStorage.setItem("@subscription_plan", "enterprise");
    return true;
  }
  return false;
}

/**
 * Deactivate admin access
 */
export async function deactivateAdminAccess(): Promise<void> {
  await AsyncStorage.removeItem(ADMIN_KEY);
  await AsyncStorage.removeItem(ADMIN_BYPASS_KEY);
  await AsyncStorage.removeItem(ADMIN_REAL_COST_KEY);
  await AsyncStorage.removeItem("@admin_activated_at");
  // Reset subscription to free
  await AsyncStorage.setItem("@subscription_plan", "free");
}

/**
 * Check if admin can bypass onboarding
 * Used in _layout.tsx to skip onboarding for admin accounts
 */
export async function canSkipOnboarding(): Promise<boolean> {
  try {
    const state = await getAdminState();
    return state.isAdmin && state.canBypassOnboarding;
  } catch {
    return false;
  }
}

/**
 * Check if the user is in real-cost mode (admin testing)
 * When true, API calls use actual costs without pricing tier markup
 */
export async function isRealCostMode(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ADMIN_REAL_COST_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

/**
 * Toggle onboarding bypass for admin
 */
export async function toggleOnboardingBypass(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ADMIN_BYPASS_KEY, enabled ? "true" : "false");
}

/**
 * Toggle real-cost mode for admin
 */
export async function toggleRealCostMode(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ADMIN_REAL_COST_KEY, enabled ? "true" : "false");
}

/**
 * Update admin PIN
 */
export async function updateAdminPin(newPin: string): Promise<void> {
  // In production, this would use proper hashing
  await AsyncStorage.setItem(ADMIN_PIN_KEY, newPin);
}

/**
 * GUARDRAIL: Enforce onboarding for non-admin users
 * This is the core guardrail — once the app is final and deployed,
 * this ensures no regular user can skip onboarding.
 * Only admin accounts (verified via PIN) can bypass.
 */
export async function enforceOnboardingGuardrail(): Promise<{
  mustOnboard: boolean;
  isAdmin: boolean;
}> {
  try {
    const onboarded = await AsyncStorage.getItem("@onboarding_complete");
    if (onboarded === "true") {
      return { mustOnboard: false, isAdmin: false };
    }
    // Not onboarded — check if admin can bypass
    const adminState = await getAdminState();
    if (adminState.isAdmin && adminState.canBypassOnboarding) {
      // Admin bypass — mark as onboarded so they don't get stuck
      await AsyncStorage.setItem("@onboarding_complete", "true");
      return { mustOnboard: false, isAdmin: true };
    }
    // Regular user must complete onboarding
    return { mustOnboard: true, isAdmin: false };
  } catch {
    return { mustOnboard: true, isAdmin: false };
  }
}
