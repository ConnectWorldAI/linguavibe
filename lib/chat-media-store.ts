import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type SharedPhoto = {
  id: string;
  uri: string;
  timestamp: number;
  sender: "me" | "them";
  thumbnail?: string;
};

export type SharedLink = {
  id: string;
  url: string;
  title: string;
  domain: string;
  timestamp: number;
  sender: "me" | "them";
  favicon?: string;
};

export type SharedDocument = {
  id: string;
  name: string;
  type: string; // pdf, doc, etc.
  size: string;
  timestamp: number;
  sender: "me" | "them";
};

export type SharedAudio = {
  id: string;
  duration: number;
  timestamp: number;
  sender: "me" | "them";
};

export type StarredMessage = {
  id: string;
  text: string;
  sender: "me" | "them";
  timestamp: number;
  contactName: string;
  contactAvatar: string;
};

export type ChatTheme = {
  type: "solid" | "gradient" | "image";
  colors: string[];
  name: string;
  imageUri?: string; // local URI for custom wallpaper from camera roll
};

export type ChatMediaData = {
  photos: SharedPhoto[];
  links: SharedLink[];
  documents: SharedDocument[];
  audio: SharedAudio[];
  starred: StarredMessage[];
  theme: ChatTheme | null;
};

// ─── STORAGE KEYS ────────────────────────────────────────────────────────────
const MEDIA_KEY_PREFIX = "@connectworld_chat_media_";
const THEME_KEY_PREFIX = "@connectworld_chat_theme_";
const STARRED_KEY_PREFIX = "@connectworld_chat_starred_";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getMediaKey(contactId: string) {
  return `${MEDIA_KEY_PREFIX}${contactId}`;
}
function getThemeKey(contactId: string) {
  return `${THEME_KEY_PREFIX}${contactId}`;
}
function getStarredKey(contactId: string) {
  return `${STARRED_KEY_PREFIX}${contactId}`;
}

// ─── MEDIA OPERATIONS ────────────────────────────────────────────────────────
export async function getChatMedia(contactId: string): Promise<ChatMediaData> {
  try {
    const raw = await AsyncStorage.getItem(getMediaKey(contactId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { photos: [], links: [], documents: [], audio: [], starred: [], theme: null };
}

export async function saveChatMedia(contactId: string, data: ChatMediaData): Promise<void> {
  try {
    await AsyncStorage.setItem(getMediaKey(contactId), JSON.stringify(data));
  } catch {}
}

export async function addSharedPhoto(contactId: string, photo: SharedPhoto): Promise<void> {
  const data = await getChatMedia(contactId);
  data.photos.unshift(photo);
  await saveChatMedia(contactId, data);
}

export async function addSharedLink(contactId: string, link: SharedLink): Promise<void> {
  const data = await getChatMedia(contactId);
  data.links.unshift(link);
  await saveChatMedia(contactId, data);
}

export async function addSharedDocument(contactId: string, doc: SharedDocument): Promise<void> {
  const data = await getChatMedia(contactId);
  data.documents.unshift(doc);
  await saveChatMedia(contactId, data);
}

export async function addSharedAudio(contactId: string, audio: SharedAudio): Promise<void> {
  const data = await getChatMedia(contactId);
  data.audio.unshift(audio);
  await saveChatMedia(contactId, data);
}

// ─── STARRED MESSAGES ────────────────────────────────────────────────────────
export async function getStarredMessages(contactId: string): Promise<StarredMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(getStarredKey(contactId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function toggleStarredMessage(
  contactId: string,
  message: StarredMessage
): Promise<boolean> {
  const starred = await getStarredMessages(contactId);
  const existingIdx = starred.findIndex((s) => s.id === message.id);
  if (existingIdx >= 0) {
    starred.splice(existingIdx, 1);
    await AsyncStorage.setItem(getStarredKey(contactId), JSON.stringify(starred));
    return false; // unstarred
  } else {
    starred.unshift(message);
    await AsyncStorage.setItem(getStarredKey(contactId), JSON.stringify(starred));
    return true; // starred
  }
}

export async function isMessageStarred(contactId: string, messageId: string): Promise<boolean> {
  const starred = await getStarredMessages(contactId);
  return starred.some((s) => s.id === messageId);
}

// ─── CHAT THEME ──────────────────────────────────────────────────────────────
export async function getChatTheme(contactId: string): Promise<ChatTheme | null> {
  try {
    const raw = await AsyncStorage.getItem(getThemeKey(contactId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export async function setChatTheme(contactId: string, theme: ChatTheme | null): Promise<void> {
  try {
    if (theme) {
      await AsyncStorage.setItem(getThemeKey(contactId), JSON.stringify(theme));
    } else {
      await AsyncStorage.removeItem(getThemeKey(contactId));
    }
  } catch {}
}

// ─── URL DETECTION ───────────────────────────────────────────────────────────
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

export function extractUrlsFromText(text: string): string[] {
  return text.match(URL_REGEX) || [];
}

export function getDomainFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch {
    return url.slice(0, 30);
  }
}

export function getTitleFromUrl(url: string): string {
  const domain = getDomainFromUrl(url);
  const path = url.split("/").filter(Boolean).pop() || "";
  if (path && path !== domain) {
    return decodeURIComponent(path).replace(/[-_]/g, " ").slice(0, 50);
  }
  return domain;
}

// ─── PRESET THEMES ───────────────────────────────────────────────────────────
export const CHAT_THEMES: ChatTheme[] = [
  { type: "solid", colors: ["#0A1628"], name: "Default Dark" },
  { type: "gradient", colors: ["#1a0533", "#0d1b2a"], name: "Purple Night" },
  { type: "gradient", colors: ["#0d1b2a", "#1b3a4b"], name: "Ocean Deep" },
  { type: "gradient", colors: ["#1a0a2e", "#16213e"], name: "Midnight" },
  { type: "gradient", colors: ["#0f2027", "#203a43", "#2c5364"], name: "Teal Gradient" },
  { type: "gradient", colors: ["#200122", "#6f0000"], name: "Dark Red" },
  { type: "gradient", colors: ["#0f0c29", "#302b63", "#24243e"], name: "Cosmic" },
  { type: "gradient", colors: ["#000428", "#004e92"], name: "Blue Abyss" },
  { type: "gradient", colors: ["#141e30", "#243b55"], name: "Royal Blue" },
  { type: "gradient", colors: ["#1d1d1d", "#333333"], name: "Charcoal" },
  { type: "solid", colors: ["#1a1a2e"], name: "Navy" },
  { type: "solid", colors: ["#16213e"], name: "Steel Blue" },
  { type: "solid", colors: ["#0f3460"], name: "Deep Blue" },
  { type: "solid", colors: ["#1b1b2f"], name: "Dark Violet" },
  { type: "solid", colors: ["#162447"], name: "Indigo" },
  { type: "solid", colors: ["#1f4068"], name: "Sapphire" },
];

// ─── SAMPLE DATA (for demo/initial state) ────────────────────────────────────
export function generateSampleMedia(contactId: string): ChatMediaData {
  const now = Date.now();
  return {
    photos: [
      { id: "p1", uri: "https://picsum.photos/200/200?random=1", timestamp: now - 86400000 * 2, sender: "them" },
      { id: "p2", uri: "https://picsum.photos/200/200?random=2", timestamp: now - 86400000, sender: "me" },
      { id: "p3", uri: "https://picsum.photos/200/200?random=3", timestamp: now - 3600000, sender: "them" },
      { id: "p4", uri: "https://picsum.photos/200/200?random=4", timestamp: now - 1800000, sender: "me" },
      { id: "p5", uri: "https://picsum.photos/200/200?random=5", timestamp: now - 900000, sender: "them" },
      { id: "p6", uri: "https://picsum.photos/200/200?random=6", timestamp: now - 600000, sender: "me" },
    ],
    links: [
      { id: "l1", url: "https://duolingo.com/learn/spanish", title: "Learn Spanish - Duolingo", domain: "duolingo.com", timestamp: now - 86400000 * 3, sender: "them" },
      { id: "l2", url: "https://youtube.com/watch?v=abc123", title: "Best Spanish Music 2024", domain: "youtube.com", timestamp: now - 86400000, sender: "me" },
      { id: "l3", url: "https://spanishdict.com/translate/hola", title: "Translate Hola", domain: "spanishdict.com", timestamp: now - 3600000, sender: "them" },
    ],
    documents: [
      { id: "d1", name: "Spanish_Vocabulary_List.pdf", type: "pdf", size: "2.4 MB", timestamp: now - 86400000 * 5, sender: "them" },
      { id: "d2", name: "Lesson_Notes_Week3.docx", type: "doc", size: "156 KB", timestamp: now - 86400000 * 2, sender: "me" },
    ],
    audio: [
      { id: "a1", duration: 15, timestamp: now - 86400000 * 4, sender: "them" },
      { id: "a2", duration: 8, timestamp: now - 86400000, sender: "me" },
      { id: "a3", duration: 22, timestamp: now - 7200000, sender: "them" },
    ],
    starred: [],
    theme: null,
  };
}

// ─── DISAPPEARING MESSAGES ──────────────────────────────────────────────────
export type DisappearingTimer = "off" | "24h" | "7d" | "90d";

const DISAPPEARING_KEY_PREFIX = "@connectworld_disappearing_";

function getDisappearingKey(contactId: string) {
  return `${DISAPPEARING_KEY_PREFIX}${contactId}`;
}

export async function getDisappearingTimer(contactId: string): Promise<DisappearingTimer> {
  try {
    const raw = await AsyncStorage.getItem(getDisappearingKey(contactId));
    if (raw) return raw as DisappearingTimer;
  } catch {}
  return "off";
}

export async function setDisappearingTimer(contactId: string, timer: DisappearingTimer): Promise<void> {
  try {
    await AsyncStorage.setItem(getDisappearingKey(contactId), timer);
  } catch {}
}

export function getTimerDurationMs(timer: DisappearingTimer): number | null {
  switch (timer) {
    case "24h": return 24 * 60 * 60 * 1000;
    case "7d": return 7 * 24 * 60 * 60 * 1000;
    case "90d": return 90 * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

export function getTimerLabel(timer: DisappearingTimer): string {
  switch (timer) {
    case "24h": return "24 hours";
    case "7d": return "7 days";
    case "90d": return "90 days";
    default: return "Off";
  }
}

export function isMessageExpired(messageTimestamp: number, timer: DisappearingTimer): boolean {
  const duration = getTimerDurationMs(timer);
  if (!duration) return false;
  return Date.now() - messageTimestamp > duration;
}
