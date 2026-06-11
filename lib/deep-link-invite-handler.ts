/**
 * Deep Link Invite Handler
 * 
 * Parses incoming invite URLs on app startup and routes users to the
 * correct screen with pre-filled context (duel room code, friend auto-accept, etc.)
 * 
 * URL Scheme: manus{timestamp}://invite?type=duel&id=ROOM123&from=USER&name=John&lang=Spanish&diff=intermediate
 * Universal Link: https://connectworld.ai/invite?type=friend&from=USER&name=Jane
 */
import * as Linking from "expo-linking";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const PENDING_INVITE_KEY = "@connectworld_pending_invite";
const INVITE_HISTORY_KEY = "@connectworld_invite_accept_history";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type InviteType = "duel" | "friend" | "study" | "class" | "referral";

export interface ParsedInvite {
  type: InviteType;
  id?: string; // room code, invite ID, or referral code
  from?: string; // sender user ID
  name?: string; // sender display name
  language?: string; // target language for duel/study
  difficulty?: string; // difficulty level
  classId?: string; // class ID for class invites
  timestamp: number; // when the invite was parsed
  source: "deep_link" | "universal_link" | "notification";
}

export interface InviteAcceptRecord {
  invite: ParsedInvite;
  acceptedAt: number;
  routedTo: string;
}

// ─── URL PARSING ────────────────────────────────────────────────────────────

/**
 * Parse an incoming URL into a structured invite object
 */
export function parseInviteURL(url: string): ParsedInvite | null {
  try {
    const parsed = Linking.parse(url);
    
    // Check if this is an invite path
    const isInvitePath = parsed.path === "invite" || 
                         parsed.path?.startsWith("invite/") ||
                         parsed.hostname === "invite";
    
    if (!isInvitePath && !parsed.queryParams?.type) return null;
    
    const params = parsed.queryParams as Record<string, string> | undefined;
    if (!params) return null;
    
    const type = params.type as InviteType;
    if (!type || !["duel", "friend", "study", "class", "referral"].includes(type)) {
      return null;
    }
    
    return {
      type,
      id: params.id || params.room || params.code,
      from: params.from || params.sender,
      name: params.name || params.senderName,
      language: params.lang || params.language,
      difficulty: params.diff || params.difficulty,
      classId: params.class || params.classId,
      timestamp: Date.now(),
      source: url.startsWith("http") ? "universal_link" : "deep_link",
    };
  } catch {
    return null;
  }
}

// ─── ROUTING ────────────────────────────────────────────────────────────────

/**
 * Route a parsed invite to the appropriate screen with pre-filled context
 */
export function routeInviteToScreen(invite: ParsedInvite): string {
  switch (invite.type) {
    case "duel": {
      // Route to duel-multiplayer with pre-filled room code
      const params: Record<string, string> = {};
      if (invite.id) params.roomCode = invite.id;
      if (invite.from) params.challengerId = invite.from;
      if (invite.name) params.challengerName = invite.name;
      if (invite.language) params.language = invite.language;
      if (invite.difficulty) params.difficulty = invite.difficulty;
      params.autoJoin = "true"; // Auto-join the room
      
      const query = new URLSearchParams(params).toString();
      const route = `/duel-multiplayer?${query}`;
      router.push(route as any);
      return route;
    }
    
    case "friend": {
      // Route to friends screen with auto-accept
      const params: Record<string, string> = {};
      if (invite.from) params.acceptFriendId = invite.from;
      if (invite.name) params.friendName = invite.name;
      params.autoAccept = "true";
      
      const query = new URLSearchParams(params).toString();
      const route = `/friends?${query}`;
      router.push(route as any);
      return route;
    }
    
    case "study": {
      // Route to study group or lesson
      const params: Record<string, string> = {};
      if (invite.id) params.sessionId = invite.id;
      if (invite.language) params.language = invite.language;
      if (invite.from) params.hostId = invite.from;
      
      const query = new URLSearchParams(params).toString();
      const route = `/voice-rooms?${query}`;
      router.push(route as any);
      return route;
    }
    
    case "class": {
      // Route to class join screen
      const params: Record<string, string> = {};
      if (invite.classId) params.classId = invite.classId;
      if (invite.from) params.teacherId = invite.from;
      if (invite.name) params.className = invite.name;
      
      const query = new URLSearchParams(params).toString();
      const route = `/classroom?${query}`;
      router.push(route as any);
      return route;
    }
    
    case "referral": {
      // Route to referral screen with code pre-filled
      const params: Record<string, string> = {};
      if (invite.id) params.referralCode = invite.id;
      if (invite.from) params.referrerId = invite.from;
      if (invite.name) params.referrerName = invite.name;
      
      const query = new URLSearchParams(params).toString();
      const route = `/referral?${query}`;
      router.push(route as any);
      return route;
    }
    
    default:
      return "";
  }
}

// ─── APP STARTUP HANDLER ────────────────────────────────────────────────────

/**
 * Initialize deep link listener for invite URLs.
 * Call this in _layout.tsx useEffect on app startup.
 * Returns a cleanup function to remove the listener.
 */
export function initInviteDeepLinkHandler(): () => void {
  // Handle URL that opened the app (cold start)
  Linking.getInitialURL().then((url) => {
    if (url) {
      const invite = parseInviteURL(url);
      if (invite) {
        // Store pending invite — will be routed after navigation is ready
        storePendingInvite(invite);
      }
    }
  }).catch(() => {});
  
  // Handle URLs received while app is running (warm start)
  const subscription = Linking.addEventListener("url", (event) => {
    const invite = parseInviteURL(event.url);
    if (invite) {
      handleIncomingInvite(invite);
    }
  });
  
  return () => {
    subscription.remove();
  };
}

/**
 * Process a pending invite after navigation is ready.
 * Call this after the splash screen is dismissed and navigation is mounted.
 */
export async function processPendingInvite(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(PENDING_INVITE_KEY);
    if (!stored) return false;
    
    const invite: ParsedInvite = JSON.parse(stored);
    await AsyncStorage.removeItem(PENDING_INVITE_KEY);
    
    // Check if invite is still valid (within 24 hours)
    const ageMs = Date.now() - invite.timestamp;
    if (ageMs > 24 * 60 * 60 * 1000) return false;
    
    handleIncomingInvite(invite);
    return true;
  } catch {
    return false;
  }
}

// ─── INTERNAL HELPERS ───────────────────────────────────────────────────────

async function storePendingInvite(invite: ParsedInvite): Promise<void> {
  await AsyncStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(invite));
}

async function handleIncomingInvite(invite: ParsedInvite): Promise<void> {
  // Small delay to ensure navigation is ready
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const routedTo = routeInviteToScreen(invite);
  
  // Record acceptance
  if (routedTo) {
    const record: InviteAcceptRecord = {
      invite,
      acceptedAt: Date.now(),
      routedTo,
    };
    await recordInviteAcceptance(record);
  }
}

async function recordInviteAcceptance(record: InviteAcceptRecord): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(INVITE_HISTORY_KEY);
    const history: InviteAcceptRecord[] = stored ? JSON.parse(stored) : [];
    history.unshift(record);
    // Keep last 50 records
    await AsyncStorage.setItem(INVITE_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch {}
}

/**
 * Get invite acceptance history
 */
export async function getInviteAcceptHistory(): Promise<InviteAcceptRecord[]> {
  try {
    const stored = await AsyncStorage.getItem(INVITE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Check if there's a pending invite waiting to be processed
 */
export async function hasPendingInvite(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(PENDING_INVITE_KEY);
    return stored !== null;
  } catch {
    return false;
  }
}
