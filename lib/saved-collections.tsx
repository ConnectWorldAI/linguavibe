import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── TYPES ───
export type SavedItemType = "video" | "lesson" | "post" | "song" | "article" | "cultural" | "translation";

export interface SavedItem {
  id: string;
  type: SavedItemType;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  icon?: string;
  iconColor?: string;
  language?: string;
  languageFlag?: string;
  duration?: string;
  savedAt: number; // timestamp
  folderId: string; // which folder it belongs to ("all" = unsorted)
  sourceScreen?: string; // where it was saved from
}

export interface SavedFolder {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  createdAt: number;
  isDefault?: boolean; // "All Saved" folder can't be deleted
}

interface SavedCollectionsState {
  items: SavedItem[];
  folders: SavedFolder[];
}

interface SavedCollectionsContextType {
  items: SavedItem[];
  folders: SavedFolder[];
  // Item operations
  saveItem: (item: Omit<SavedItem, "savedAt" | "folderId">, folderId?: string) => void;
  unsaveItem: (itemId: string) => void;
  moveItem: (itemId: string, toFolderId: string) => void;
  isItemSaved: (itemId: string) => boolean;
  getItemsInFolder: (folderId: string) => SavedItem[];
  // Folder operations
  createFolder: (name: string, emoji?: string, color?: string) => SavedFolder;
  renameFolder: (folderId: string, newName: string) => void;
  deleteFolder: (folderId: string) => void;
  updateFolderEmoji: (folderId: string, emoji: string) => void;
}

const STORAGE_KEY = "@connectworld_saved_collections";

const DEFAULT_FOLDERS: SavedFolder[] = [
  { id: "all", name: "All Saved", emoji: "📌", isDefault: true, createdAt: 0 },
];

const SavedCollectionsContext = createContext<SavedCollectionsContextType | null>(null);

export function SavedCollectionsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SavedCollectionsState>({
    items: [],
    folders: DEFAULT_FOLDERS,
  });

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data) as SavedCollectionsState;
          // Ensure default folder always exists
          const hasDefault = parsed.folders.some((f) => f.id === "all");
          if (!hasDefault) {
            parsed.folders = [...DEFAULT_FOLDERS, ...parsed.folders];
          }
          setState(parsed);
        } catch {
          // corrupted data, reset
        }
      }
    });
  }, []);

  // Persist to AsyncStorage on every change
  const persist = useCallback((newState: SavedCollectionsState) => {
    setState(newState);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch(() => {});
  }, []);

  const saveItem = useCallback(
    (item: Omit<SavedItem, "savedAt" | "folderId">, folderId?: string) => {
      setState((prev) => {
        // Don't save duplicates
        if (prev.items.some((i) => i.id === item.id)) return prev;
        const newItem: SavedItem = {
          ...item,
          savedAt: Date.now(),
          folderId: folderId || "all",
        };
        const newState = { ...prev, items: [newItem, ...prev.items] };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch(() => {});
        return newState;
      });
    },
    []
  );

  const unsaveItem = useCallback((itemId: string) => {
    setState((prev) => {
      const newState = { ...prev, items: prev.items.filter((i) => i.id !== itemId) };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch(() => {});
      return newState;
    });
  }, []);

  const moveItem = useCallback((itemId: string, toFolderId: string) => {
    setState((prev) => {
      const newState = {
        ...prev,
        items: prev.items.map((i) => (i.id === itemId ? { ...i, folderId: toFolderId } : i)),
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch(() => {});
      return newState;
    });
  }, []);

  const isItemSaved = useCallback(
    (itemId: string) => state.items.some((i) => i.id === itemId),
    [state.items]
  );

  const getItemsInFolder = useCallback(
    (folderId: string) => {
      if (folderId === "all") return state.items;
      return state.items.filter((i) => i.folderId === folderId);
    },
    [state.items]
  );

  const createFolder = useCallback(
    (name: string, emoji?: string, color?: string): SavedFolder => {
      const newFolder: SavedFolder = {
        id: `folder_${Date.now()}`,
        name,
        emoji: emoji || "📁",
        color: color || "#8B5CF6",
        createdAt: Date.now(),
      };
      setState((prev) => {
        const newState = { ...prev, folders: [...prev.folders, newFolder] };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch(() => {});
        return newState;
      });
      return newFolder;
    },
    []
  );

  const renameFolder = useCallback((folderId: string, newName: string) => {
    setState((prev) => {
      const newState = {
        ...prev,
        folders: prev.folders.map((f) => (f.id === folderId ? { ...f, name: newName } : f)),
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch(() => {});
      return newState;
    });
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setState((prev) => {
      // Move items from deleted folder to "all"
      const newItems = prev.items.map((i) =>
        i.folderId === folderId ? { ...i, folderId: "all" } : i
      );
      const newState = {
        items: newItems,
        folders: prev.folders.filter((f) => f.id !== folderId || f.isDefault),
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch(() => {});
      return newState;
    });
  }, []);

  const updateFolderEmoji = useCallback((folderId: string, emoji: string) => {
    setState((prev) => {
      const newState = {
        ...prev,
        folders: prev.folders.map((f) => (f.id === folderId ? { ...f, emoji } : f)),
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch(() => {});
      return newState;
    });
  }, []);

  return (
    <SavedCollectionsContext.Provider
      value={{
        items: state.items,
        folders: state.folders,
        saveItem,
        unsaveItem,
        moveItem,
        isItemSaved,
        getItemsInFolder,
        createFolder,
        renameFolder,
        deleteFolder,
        updateFolderEmoji,
      }}
    >
      {children}
    </SavedCollectionsContext.Provider>
  );
}

export function useSavedCollections() {
  const ctx = useContext(SavedCollectionsContext);
  if (!ctx) {
    throw new Error("useSavedCollections must be used within SavedCollectionsProvider");
  }
  return ctx;
}
