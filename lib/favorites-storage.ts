import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "@connectworld_favorites";

export interface FavoriteItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  pinnedAt: number; // timestamp
}

/**
 * Get all favorite/pinned features
 */
export async function getFavorites(): Promise<FavoriteItem[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!data) return [];
    return JSON.parse(data) as FavoriteItem[];
  } catch {
    return [];
  }
}

/**
 * Add a feature to favorites
 */
export async function addFavorite(item: Omit<FavoriteItem, "pinnedAt">): Promise<FavoriteItem[]> {
  const favorites = await getFavorites();
  // Don't add duplicates
  if (favorites.some((f) => f.id === item.id)) return favorites;
  const newFav: FavoriteItem = { ...item, pinnedAt: Date.now() };
  const updated = [newFav, ...favorites];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Remove a feature from favorites
 */
export async function removeFavorite(id: string): Promise<FavoriteItem[]> {
  const favorites = await getFavorites();
  const updated = favorites.filter((f) => f.id !== id);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Check if a feature is in favorites
 */
export async function isFavorite(id: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some((f) => f.id === id);
}

/**
 * Toggle a feature in favorites
 */
export async function toggleFavorite(item: Omit<FavoriteItem, "pinnedAt">): Promise<{ favorites: FavoriteItem[]; added: boolean }> {
  const favorites = await getFavorites();
  const exists = favorites.some((f) => f.id === item.id);
  if (exists) {
    const updated = favorites.filter((f) => f.id !== item.id);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return { favorites: updated, added: false };
  } else {
    const newFav: FavoriteItem = { ...item, pinnedAt: Date.now() };
    const updated = [newFav, ...favorites];
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return { favorites: updated, added: true };
  }
}

/**
 * Reorder favorites (move item to new index)
 */
export async function reorderFavorites(fromIndex: number, toIndex: number): Promise<FavoriteItem[]> {
  const favorites = await getFavorites();
  if (fromIndex < 0 || fromIndex >= favorites.length || toIndex < 0 || toIndex >= favorites.length) {
    return favorites;
  }
  const [item] = favorites.splice(fromIndex, 1);
  favorites.splice(toIndex, 0, item);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return favorites;
}

/**
 * Clear all favorites
 */
export async function clearFavorites(): Promise<void> {
  await AsyncStorage.removeItem(FAVORITES_KEY);
}
