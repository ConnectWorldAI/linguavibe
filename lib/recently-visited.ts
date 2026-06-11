/**
 * Recently Visited Features — AsyncStorage persistence
 * Tracks the last 5 features the user tapped on the home screen.
 * Supports pinning items so they remain permanently visible regardless of recency.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@connectworld_recently_visited";
const PINNED_KEY = "@connectworld_pinned_features";
const MAX_ITEMS = 5;

export interface RecentlyVisitedItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  color: string;
  visitedAt: number;
  pinned?: boolean;
}

/**
 * Get the list of recently visited features (max 5, most recent first).
 */
export async function getRecentlyVisited(): Promise<RecentlyVisitedItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: RecentlyVisitedItem[] = JSON.parse(raw);
    return items.slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

/**
 * Add a feature to the recently visited list.
 * Deduplicates by id (moves existing item to front) and caps at 5 items.
 */
export async function addRecentlyVisited(item: Omit<RecentlyVisitedItem, "visitedAt">): Promise<void> {
  try {
    const existing = await getRecentlyVisited();
    // Remove duplicate if exists
    const filtered = existing.filter((i) => i.id !== item.id);
    // Prepend new item
    const updated: RecentlyVisitedItem[] = [
      { ...item, visitedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Clear all recently visited items.
 */
export async function clearRecentlyVisited(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ─── Pinned Features ─────────────────────────────────────────────────────────

/**
 * Get the list of pinned features.
 */
export async function getPinnedFeatures(): Promise<RecentlyVisitedItem[]> {
  try {
    const raw = await AsyncStorage.getItem(PINNED_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Pin a feature so it stays permanently visible in the Recently Visited row.
 */
export async function pinFeature(item: Omit<RecentlyVisitedItem, "visitedAt" | "pinned">): Promise<void> {
  try {
    const pinned = await getPinnedFeatures();
    // Don't duplicate
    if (pinned.some((p) => p.id === item.id)) return;
    const updated = [...pinned, { ...item, visitedAt: Date.now(), pinned: true }];
    await AsyncStorage.setItem(PINNED_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Unpin a feature (remove from pinned list).
 */
export async function unpinFeature(id: string): Promise<void> {
  try {
    const pinned = await getPinnedFeatures();
    const updated = pinned.filter((p) => p.id !== id);
    await AsyncStorage.setItem(PINNED_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Reorder pinned features by providing the new ordered array of IDs.
 */
export async function reorderPinnedFeatures(orderedIds: string[]): Promise<void> {
  try {
    const pinned = await getPinnedFeatures();
    const ordered = orderedIds
      .map((id) => pinned.find((p) => p.id === id))
      .filter(Boolean) as RecentlyVisitedItem[];
    // Append any items not in orderedIds at the end (safety)
    const remaining = pinned.filter((p) => !orderedIds.includes(p.id));
    await AsyncStorage.setItem(PINNED_KEY, JSON.stringify([...ordered, ...remaining]));
  } catch {}
}

/**
 * Bulk unpin multiple features at once.
 */
export async function bulkUnpinFeatures(ids: string[]): Promise<void> {
  try {
    const pinned = await getPinnedFeatures();
    const updated = pinned.filter((p) => !ids.includes(p.id));
    await AsyncStorage.setItem(PINNED_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Check if a feature is pinned.
 */
export async function isFeaturePinned(id: string): Promise<boolean> {
  try {
    const pinned = await getPinnedFeatures();
    return pinned.some((p) => p.id === id);
  } catch {
    return false;
  }
}

/**
 * Get the merged list: pinned items first, then recent items (excluding pinned ones).
 * Total capped at MAX_ITEMS + pinned count (pinned are always shown).
 */
export async function getMergedRecentAndPinned(): Promise<RecentlyVisitedItem[]> {
  try {
    const pinned = await getPinnedFeatures();
    const recent = await getRecentlyVisited();
    // Filter out pinned items from recent list
    const recentFiltered = recent.filter((r) => !pinned.some((p) => p.id === r.id));
    // Pinned first, then recent (cap recent at MAX_ITEMS)
    return [
      ...pinned.map((p) => ({ ...p, pinned: true })),
      ...recentFiltered.slice(0, MAX_ITEMS).map((r) => ({ ...r, pinned: false })),
    ];
  } catch {
    return [];
  }
}
