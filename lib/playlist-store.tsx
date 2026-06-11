import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@connectworld_playlists";

export interface PlaylistSong {
  id: string;
  title: string;
  artist: string;
  language: string;
  languageFlag: string;
  duration?: string;
  audioUrl?: string;
  isRemix?: boolean;
  isDownloaded?: boolean;
  isLiked?: boolean;
  addedAt: number;
  playedAt?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverColor: string;
  songs: PlaylistSong[];
  createdAt: number;
  updatedAt: number;
}

interface PlaylistState {
  playlists: Playlist[];
  downloads: PlaylistSong[];
  likedSongs: PlaylistSong[];
  recentlyPlayed: PlaylistSong[];
}

interface PlaylistContextValue {
  playlists: Playlist[];
  downloads: PlaylistSong[];
  likedSongs: PlaylistSong[];
  recentlyPlayed: PlaylistSong[];
  createPlaylist: (name: string, description?: string) => Playlist;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, song: Omit<PlaylistSong, "addedAt">) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  isSongInPlaylist: (playlistId: string, songId: string) => boolean;
  downloadSong: (song: Omit<PlaylistSong, "addedAt" | "isDownloaded">) => void;
  removeDownload: (songId: string) => void;
  isDownloaded: (songId: string) => boolean;
  likeSong: (song: Omit<PlaylistSong, "addedAt" | "isLiked">) => void;
  unlikeSong: (songId: string) => void;
  isLiked: (songId: string) => boolean;
  addToRecentlyPlayed: (song: Omit<PlaylistSong, "addedAt" | "playedAt">) => void;
  clearRecentlyPlayed: () => void;
  getPlaylistById: (id: string) => Playlist | undefined;
}

const PlaylistContext = createContext<PlaylistContextValue | null>(null);

const COVER_COLORS = [
  "#1E3A5F", "#3D1B5F", "#1B5F3D", "#5F3D1B", "#1B3D5F",
  "#5F1B3D", "#3D5F1B", "#1B5F5F", "#5F5F1B", "#3D1B1B",
];

const MAX_RECENTLY_PLAYED = 50;

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlaylistState>({
    playlists: [],
    downloads: [],
    likedSongs: [],
    recentlyPlayed: [],
  });

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setState({
            playlists: parsed.playlists || [],
            downloads: parsed.downloads || [],
            likedSongs: parsed.likedSongs || [],
            recentlyPlayed: parsed.recentlyPlayed || [],
          });
        } catch {}
      }
    });
  }, []);

  // Persist to AsyncStorage on change
  const persist = useCallback((newState: PlaylistState) => {
    setState(newState);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const createPlaylist = useCallback((name: string, description?: string): Playlist => {
    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      description,
      coverColor: COVER_COLORS[state.playlists.length % COVER_COLORS.length],
      songs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const newState = { ...state, playlists: [...state.playlists, newPlaylist] };
    persist(newState);
    return newPlaylist;
  }, [state, persist]);

  const renamePlaylist = useCallback((id: string, name: string) => {
    const newState = {
      ...state,
      playlists: state.playlists.map((p) =>
        p.id === id ? { ...p, name, updatedAt: Date.now() } : p
      ),
    };
    persist(newState);
  }, [state, persist]);

  const deletePlaylist = useCallback((id: string) => {
    const newState = {
      ...state,
      playlists: state.playlists.filter((p) => p.id !== id),
    };
    persist(newState);
  }, [state, persist]);

  const addSongToPlaylist = useCallback((playlistId: string, song: Omit<PlaylistSong, "addedAt">) => {
    const newState = {
      ...state,
      playlists: state.playlists.map((p) => {
        if (p.id !== playlistId) return p;
        if (p.songs.some((s) => s.id === song.id)) return p;
        return {
          ...p,
          songs: [...p.songs, { ...song, addedAt: Date.now() }],
          updatedAt: Date.now(),
        };
      }),
    };
    persist(newState);
  }, [state, persist]);

  const removeSongFromPlaylist = useCallback((playlistId: string, songId: string) => {
    const newState = {
      ...state,
      playlists: state.playlists.map((p) => {
        if (p.id !== playlistId) return p;
        return {
          ...p,
          songs: p.songs.filter((s) => s.id !== songId),
          updatedAt: Date.now(),
        };
      }),
    };
    persist(newState);
  }, [state, persist]);

  const isSongInPlaylist = useCallback((playlistId: string, songId: string): boolean => {
    const playlist = state.playlists.find((p) => p.id === playlistId);
    return playlist?.songs.some((s) => s.id === songId) ?? false;
  }, [state]);

  const downloadSong = useCallback((song: Omit<PlaylistSong, "addedAt" | "isDownloaded">) => {
    if (state.downloads.some((d) => d.id === song.id)) return;
    const newState = {
      ...state,
      downloads: [...state.downloads, { ...song, isDownloaded: true, addedAt: Date.now() }],
    };
    persist(newState);
  }, [state, persist]);

  const removeDownload = useCallback((songId: string) => {
    const newState = {
      ...state,
      downloads: state.downloads.filter((d) => d.id !== songId),
    };
    persist(newState);
  }, [state, persist]);

  const isDownloaded = useCallback((songId: string): boolean => {
    return state.downloads.some((d) => d.id === songId);
  }, [state]);

  // Liked Songs
  const likeSong = useCallback((song: Omit<PlaylistSong, "addedAt" | "isLiked">) => {
    if (state.likedSongs.some((s) => s.id === song.id)) return;
    const newState = {
      ...state,
      likedSongs: [{ ...song, isLiked: true, addedAt: Date.now() }, ...state.likedSongs],
    };
    persist(newState);
  }, [state, persist]);

  const unlikeSong = useCallback((songId: string) => {
    const newState = {
      ...state,
      likedSongs: state.likedSongs.filter((s) => s.id !== songId),
    };
    persist(newState);
  }, [state, persist]);

  const isLiked = useCallback((songId: string): boolean => {
    return state.likedSongs.some((s) => s.id === songId);
  }, [state]);

  // Recently Played
  const addToRecentlyPlayed = useCallback((song: Omit<PlaylistSong, "addedAt" | "playedAt">) => {
    const filtered = state.recentlyPlayed.filter((s) => s.id !== song.id);
    const newEntry: PlaylistSong = { ...song, addedAt: Date.now(), playedAt: Date.now() };
    const newList = [newEntry, ...filtered].slice(0, MAX_RECENTLY_PLAYED);
    const newState = { ...state, recentlyPlayed: newList };
    persist(newState);
  }, [state, persist]);

  const clearRecentlyPlayed = useCallback(() => {
    const newState = { ...state, recentlyPlayed: [] };
    persist(newState);
  }, [state, persist]);

  const getPlaylistById = useCallback((id: string): Playlist | undefined => {
    return state.playlists.find((p) => p.id === id);
  }, [state]);

  return (
    <PlaylistContext.Provider
      value={{
        playlists: state.playlists,
        downloads: state.downloads,
        likedSongs: state.likedSongs,
        recentlyPlayed: state.recentlyPlayed,
        createPlaylist,
        renamePlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        isSongInPlaylist,
        downloadSong,
        removeDownload,
        isDownloaded,
        likeSong,
        unlikeSong,
        isLiked,
        addToRecentlyPlayed,
        clearRecentlyPlayed,
        getPlaylistById,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error("usePlaylist must be used within PlaylistProvider");
  return ctx;
}
