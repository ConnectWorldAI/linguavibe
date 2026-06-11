import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SyncableData {
  lessons: string[]; // completed lesson IDs
  cefrLevel: string;
  streak: number;
  totalXp: number;
  flashcards: any[];
  submissions: any[];
  preferences: Record<string, any>;
  vocabulary: any[];
  achievements: string[];
  lastSyncedAt: string;
}

interface SyncStatus {
  lastSynced: string | null;
  pendingChanges: number;
  isSyncing: boolean;
  error: string | null;
}

// ─── Storage Keys ────────────────────────────────────────────────────────────
const SYNC_KEYS = {
  lessons: "@lesson_progress",
  cefrLevel: "@cefr_level",
  streak: "@streak_count",
  totalXp: "@total_xp",
  flashcards: "@flashcard_decks",
  submissions: "@wavy_eq_submissions",
  preferences: "@user_preferences",
  vocabulary: "@vocabulary_lists",
  achievements: "@achievements",
};

const SYNC_STATUS_KEY = "@sync_status";
const SYNC_QUEUE_KEY = "@sync_queue";

// ─── Sync Manager ────────────────────────────────────────────────────────────
class DataSyncManager {
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Collect all local data into a single syncable object
   */
  async collectLocalData(): Promise<SyncableData> {
    const data: SyncableData = {
      lessons: [],
      cefrLevel: "A1",
      streak: 0,
      totalXp: 0,
      flashcards: [],
      submissions: [],
      preferences: {},
      vocabulary: [],
      achievements: [],
      lastSyncedAt: new Date().toISOString(),
    };

    try {
      const lessons = await AsyncStorage.getItem(SYNC_KEYS.lessons);
      if (lessons) data.lessons = JSON.parse(lessons);

      const level = await AsyncStorage.getItem(SYNC_KEYS.cefrLevel);
      if (level) data.cefrLevel = level;

      const streak = await AsyncStorage.getItem(SYNC_KEYS.streak);
      if (streak) data.streak = parseInt(streak, 10);

      const xp = await AsyncStorage.getItem(SYNC_KEYS.totalXp);
      if (xp) data.totalXp = parseInt(xp, 10);

      const flashcards = await AsyncStorage.getItem(SYNC_KEYS.flashcards);
      if (flashcards) data.flashcards = JSON.parse(flashcards);

      const submissions = await AsyncStorage.getItem(SYNC_KEYS.submissions);
      if (submissions) data.submissions = JSON.parse(submissions);

      const prefs = await AsyncStorage.getItem(SYNC_KEYS.preferences);
      if (prefs) data.preferences = JSON.parse(prefs);

      const vocab = await AsyncStorage.getItem(SYNC_KEYS.vocabulary);
      if (vocab) data.vocabulary = JSON.parse(vocab);

      const achievements = await AsyncStorage.getItem(SYNC_KEYS.achievements);
      if (achievements) data.achievements = JSON.parse(achievements);
    } catch (e) {
      console.warn("[DataSync] Error collecting local data:", e);
    }

    return data;
  }

  /**
   * Apply remote data to local storage (merge strategy: latest wins)
   */
  async applyRemoteData(remote: SyncableData): Promise<void> {
    try {
      // Merge lessons (union of both sets)
      const localLessons = await AsyncStorage.getItem(SYNC_KEYS.lessons);
      const localSet = new Set(localLessons ? JSON.parse(localLessons) : []);
      const merged = [...new Set([...localSet, ...remote.lessons])];
      await AsyncStorage.setItem(SYNC_KEYS.lessons, JSON.stringify(merged));

      // Higher value wins for numeric fields
      const localStreak = parseInt((await AsyncStorage.getItem(SYNC_KEYS.streak)) || "0", 10);
      if (remote.streak > localStreak) {
        await AsyncStorage.setItem(SYNC_KEYS.streak, String(remote.streak));
      }

      const localXp = parseInt((await AsyncStorage.getItem(SYNC_KEYS.totalXp)) || "0", 10);
      if (remote.totalXp > localXp) {
        await AsyncStorage.setItem(SYNC_KEYS.totalXp, String(remote.totalXp));
      }

      // Level: use the higher CEFR level
      const levelOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];
      const localLevel = (await AsyncStorage.getItem(SYNC_KEYS.cefrLevel)) || "A1";
      if (levelOrder.indexOf(remote.cefrLevel) > levelOrder.indexOf(localLevel)) {
        await AsyncStorage.setItem(SYNC_KEYS.cefrLevel, remote.cefrLevel);
      }

      // Merge achievements (union)
      const localAchievements = await AsyncStorage.getItem(SYNC_KEYS.achievements);
      const localAchSet = new Set(localAchievements ? JSON.parse(localAchievements) : []);
      const mergedAch = [...new Set([...localAchSet, ...remote.achievements])];
      await AsyncStorage.setItem(SYNC_KEYS.achievements, JSON.stringify(mergedAch));

      // Submissions: merge by ID, no duplicates
      const localSubs = await AsyncStorage.getItem(SYNC_KEYS.submissions);
      const localSubArr = localSubs ? JSON.parse(localSubs) : [];
      const localSubIds = new Set(localSubArr.map((s: any) => s.id));
      const newSubs = remote.submissions.filter((s: any) => !localSubIds.has(s.id));
      await AsyncStorage.setItem(SYNC_KEYS.submissions, JSON.stringify([...localSubArr, ...newSubs]));

      // Flashcards: merge by deck ID
      const localCards = await AsyncStorage.getItem(SYNC_KEYS.flashcards);
      const localCardArr = localCards ? JSON.parse(localCards) : [];
      const localDeckIds = new Set(localCardArr.map((d: any) => d.id));
      const newDecks = remote.flashcards.filter((d: any) => !localDeckIds.has(d.id));
      await AsyncStorage.setItem(SYNC_KEYS.flashcards, JSON.stringify([...localCardArr, ...newDecks]));

      // Vocabulary: merge by word
      const localVocab = await AsyncStorage.getItem(SYNC_KEYS.vocabulary);
      const localVocabArr = localVocab ? JSON.parse(localVocab) : [];
      const localWords = new Set(localVocabArr.map((v: any) => v.word));
      const newWords = remote.vocabulary.filter((v: any) => !localWords.has(v.word));
      await AsyncStorage.setItem(SYNC_KEYS.vocabulary, JSON.stringify([...localVocabArr, ...newWords]));

    } catch (e) {
      console.warn("[DataSync] Error applying remote data:", e);
    }
  }

  /**
   * Queue a change for sync (called after any local data modification)
   */
  async queueChange(key: string, value: any): Promise<void> {
    try {
      const queue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const changes = queue ? JSON.parse(queue) : [];
      changes.push({ key, value, timestamp: Date.now() });
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(changes));
    } catch (e) {}
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_STATUS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { lastSynced: null, pendingChanges: 0, isSyncing: false, error: null };
  }

  /**
   * Perform a full sync cycle (upload local → download remote → merge)
   * In production, this calls the tRPC server endpoints
   */
  async performSync(): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;

    try {
      const localData = await this.collectLocalData();

      // Sync to server when authenticated
      try {
        const { trpcVanillaClient } = require("@/lib/trpc");
        if (trpcVanillaClient?.sync?.push) {
          const result = await trpcVanillaClient.sync.push.mutate(localData);
          if (result?.mergedData) {
            await this.applyRemoteData(result.mergedData);
          }
        }
      } catch {
        // Server sync unavailable — local data preserved, will retry next cycle
      }

      // Update sync status
      const status: SyncStatus = {
        lastSynced: new Date().toISOString(),
        pendingChanges: 0,
        isSyncing: false,
        error: null,
      };
      await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));

      // Clear sync queue
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));

      return true;
    } catch (e: any) {
      const status: SyncStatus = {
        lastSynced: null,
        pendingChanges: 0,
        isSyncing: false,
        error: e.message || "Sync failed",
      };
      await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Start periodic background sync (every 5 minutes)
   */
  startPeriodicSync(): void {
    if (this.syncInterval) return;
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const syncManager = new DataSyncManager();
export default syncManager;
