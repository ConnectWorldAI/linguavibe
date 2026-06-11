/**
 * Friend Invite System
 * 
 * Deep link-based friend invites with challenge links for duels,
 * study sessions, and general app invites.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Share, Platform } from "react-native";
import * as Linking from "expo-linking";

// Storage keys
const INVITE_HISTORY_KEY = "@connectworld_invite_history";
const PENDING_INVITES_KEY = "@connectworld_pending_invites";
const INVITE_CODE_KEY = "@connectworld_my_invite_code";

// Deep link scheme
const APP_SCHEME = "connectworldai";
const WEB_BASE_URL = "https://connectworld.ai";

export type InviteType = "friend" | "duel" | "study" | "class" | "referral";

export interface FriendInvite {
  id: string;
  type: InviteType;
  senderName: string;
  senderCode: string;
  recipientName?: string;
  message?: string;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired" | "declined";
  metadata?: {
    duelLanguage?: string;
    duelDifficulty?: string;
    classId?: string;
    className?: string;
  };
}

export interface InviteLink {
  deepLink: string;
  webLink: string;
  shareMessage: string;
}

/**
 * Generate a unique invite code for the user
 */
export async function getMyInviteCode(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(INVITE_CODE_KEY);
    if (stored) return stored;
  } catch {}
  const code = generateCode();
  await AsyncStorage.setItem(INVITE_CODE_KEY, code);
  return code;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Create an invite link for a specific type
 */
export function createInviteLink(
  type: InviteType,
  senderName: string,
  senderCode: string,
  metadata?: FriendInvite["metadata"]
): InviteLink {
  const inviteId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const params = new URLSearchParams({
    type,
    from: senderCode,
    name: senderName,
    id: inviteId,
  });

  if (metadata?.duelLanguage) params.set("lang", metadata.duelLanguage);
  if (metadata?.duelDifficulty) params.set("diff", metadata.duelDifficulty);
  if (metadata?.classId) params.set("class", metadata.classId);

  const deepLink = `${APP_SCHEME}://invite?${params.toString()}`;
  const webLink = `${WEB_BASE_URL}/invite?${params.toString()}`;

  const shareMessage = getShareMessage(type, senderName, webLink, metadata);

  return { deepLink, webLink, shareMessage };
}

/**
 * Generate a contextual share message based on invite type
 */
function getShareMessage(
  type: InviteType,
  senderName: string,
  link: string,
  metadata?: FriendInvite["metadata"]
): string {
  switch (type) {
    case "duel":
      return `⚔️ ${senderName} challenges you to a pronunciation duel${metadata?.duelLanguage ? ` in ${metadata.duelLanguage}` : ""}! Think you can beat me?\n\nAccept the challenge: ${link}`;
    case "study":
      return `📚 ${senderName} wants to study with you on ConnectWorld AI! Join our study session and practice together.\n\nJoin here: ${link}`;
    case "class":
      return `🎓 ${senderName} invited you to join "${metadata?.className || "a class"}" on ConnectWorld AI!\n\nJoin the class: ${link}`;
    case "referral":
      return `🎁 ${senderName} wants you to try ConnectWorld AI! Sign up and you both get 25 free credits for video calls and translations.\n\nGet started: ${link}`;
    case "friend":
    default:
      return `👋 ${senderName} wants to connect with you on ConnectWorld AI — free WiFi calling, messaging, and real-time translation!\n\nConnect here: ${link}`;
  }
}

/**
 * Share an invite via the native share sheet
 */
export async function shareInvite(invite: InviteLink): Promise<boolean> {
  try {
    const result = await Share.share({
      message: invite.shareMessage,
      url: Platform.OS === "ios" ? invite.webLink : undefined,
    });
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}

/**
 * Create and share a duel challenge link
 */
export async function shareDuelChallenge(
  senderName: string,
  language: string,
  difficulty: string
): Promise<boolean> {
  const code = await getMyInviteCode();
  const link = createInviteLink("duel", senderName, code, {
    duelLanguage: language,
    duelDifficulty: difficulty,
  });
  return shareInvite(link);
}

/**
 * Create and share a friend invite
 */
export async function shareFriendInvite(senderName: string): Promise<boolean> {
  const code = await getMyInviteCode();
  const link = createInviteLink("friend", senderName, code);
  return shareInvite(link);
}

/**
 * Create and share a study session invite
 */
export async function shareStudyInvite(senderName: string): Promise<boolean> {
  const code = await getMyInviteCode();
  const link = createInviteLink("study", senderName, code);
  return shareInvite(link);
}

/**
 * Create and share a class invite
 */
export async function shareClassInvite(
  senderName: string,
  classId: string,
  className: string
): Promise<boolean> {
  const code = await getMyInviteCode();
  const link = createInviteLink("class", senderName, code, { classId, className });
  return shareInvite(link);
}

/**
 * Parse an incoming deep link invite
 */
export function parseInviteLink(url: string): Partial<FriendInvite> | null {
  try {
    const parsed = Linking.parse(url);
    if (!parsed.queryParams) return null;

    const { type, from, name, id, lang, diff, class: classId } = parsed.queryParams as Record<string, string>;
    if (!type || !from || !id) return null;

    return {
      id,
      type: type as InviteType,
      senderName: name || "Someone",
      senderCode: from,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      metadata: {
        duelLanguage: lang,
        duelDifficulty: diff,
        classId,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Accept a friend invite
 */
export async function acceptInvite(invite: Partial<FriendInvite>): Promise<void> {
  const history = await getInviteHistory();
  const fullInvite: FriendInvite = {
    id: invite.id || Date.now().toString(),
    type: invite.type || "friend",
    senderName: invite.senderName || "Unknown",
    senderCode: invite.senderCode || "",
    status: "accepted",
    createdAt: invite.createdAt || new Date().toISOString(),
    expiresAt: invite.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: invite.metadata,
  };
  history.unshift(fullInvite);
  await AsyncStorage.setItem(INVITE_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

/**
 * Decline a friend invite
 */
export async function declineInvite(inviteId: string): Promise<void> {
  const pending = await getPendingInvites();
  const updated = pending.filter((i) => i.id !== inviteId);
  await AsyncStorage.setItem(PENDING_INVITES_KEY, JSON.stringify(updated));
}

/**
 * Get invite history
 */
export async function getInviteHistory(): Promise<FriendInvite[]> {
  try {
    const stored = await AsyncStorage.getItem(INVITE_HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

/**
 * Get pending invites
 */
export async function getPendingInvites(): Promise<FriendInvite[]> {
  try {
    const stored = await AsyncStorage.getItem(PENDING_INVITES_KEY);
    if (stored) {
      const invites: FriendInvite[] = JSON.parse(stored);
      // Filter out expired
      const now = new Date().toISOString();
      return invites.filter((i) => i.expiresAt > now && i.status === "pending");
    }
  } catch {}
  return [];
}

/**
 * Add a pending invite (from deep link handler)
 */
export async function addPendingInvite(invite: Partial<FriendInvite>): Promise<void> {
  const pending = await getPendingInvites();
  const fullInvite: FriendInvite = {
    id: invite.id || Date.now().toString(),
    type: invite.type || "friend",
    senderName: invite.senderName || "Unknown",
    senderCode: invite.senderCode || "",
    status: "pending",
    createdAt: invite.createdAt || new Date().toISOString(),
    expiresAt: invite.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: invite.metadata,
  };
  pending.unshift(fullInvite);
  await AsyncStorage.setItem(PENDING_INVITES_KEY, JSON.stringify(pending.slice(0, 20)));
}

/**
 * Get the count of pending invites (for badge display)
 */
export async function getPendingInviteCount(): Promise<number> {
  const pending = await getPendingInvites();
  return pending.length;
}

/**
 * Get invite type label for display
 */
export function getInviteTypeLabel(type: InviteType): string {
  switch (type) {
    case "duel": return "Duel Challenge";
    case "study": return "Study Session";
    case "class": return "Class Invite";
    case "referral": return "Referral";
    case "friend": return "Friend Request";
    default: return "Invite";
  }
}

/**
 * Get invite type icon
 */
export function getInviteTypeIcon(type: InviteType): string {
  switch (type) {
    case "duel": return "⚔️";
    case "study": return "📚";
    case "class": return "🎓";
    case "referral": return "🎁";
    case "friend": return "👋";
    default: return "✉️";
  }
}
