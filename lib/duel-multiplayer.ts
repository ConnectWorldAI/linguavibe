/**
 * Duel Multiplayer Client Library
 *
 * WebSocket client for real-time pronunciation duel matchmaking.
 * Manages connection, event handling, and game state synchronization.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";

// ─── Types ──────────────────────────────────────────────────────────────────

export type MultiplayerState =
  | "idle"
  | "connecting"
  | "queued"
  | "creating_room"
  | "waiting_for_opponent"
  | "matched"
  | "countdown"
  | "playing"
  | "scoring"
  | "round_result"
  | "complete"
  | "disconnected"
  | "error";

export interface MultiplayerRoundResult {
  playerId: string;
  playerName: string;
  score: number;
  time: number;
  totalScore: number;
}

export interface MatchCompleteData {
  winner: { id: string; name: string } | null;
  isTie: boolean;
  finalScores: {
    playerId: string;
    playerName: string;
    totalScore: number;
    roundScores: number[];
  }[];
}

export interface MultiplayerEvent {
  type: string;
  [key: string]: any;
}

type EventListener = (event: MultiplayerEvent) => void;

// ─── WebSocket URL Resolution ───────────────────────────────────────────────

function getWebSocketUrl(): string {
  // In development, connect to the local server
  const apiUrl = Platform.select({
    web: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    default: "http://localhost:3000",
  });

  // Convert http(s) to ws(s)
  const wsUrl = apiUrl.replace(/^http/, "ws");
  return `${wsUrl}/ws/duel`;
}

// ─── Multiplayer Client Class ───────────────────────────────────────────────

export class DuelMultiplayerClient {
  private ws: WebSocket | null = null;
  private state: MultiplayerState = "idle";
  private playerId: string | null = null;
  private roomId: string | null = null;
  private roomCode: string | null = null;
  private opponentName: string | null = null;
  private currentRound: number = 0;
  private totalRounds: number = 5;
  private listeners: Map<string, EventListener[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  // ─── Connection Management ──────────────────────────────────────────

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.setState("connecting");
      const url = getWebSocketUrl();

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string);
            this.handleServerMessage(data);
          } catch {}
        };

        this.ws.onclose = () => {
          this.stopPing();
          if (this.state !== "idle" && this.state !== "complete") {
            this.setState("disconnected");
            this.emit({ type: "disconnected" });
            this.attemptReconnect();
          }
        };

        this.ws.onerror = () => {
          if (this.state === "connecting") {
            this.setState("error");
            reject(new Error("WebSocket connection failed"));
          }
        };
      } catch (err) {
        this.setState("error");
        reject(err);
      }
    });
  }

  disconnect() {
    this.setState("idle");
    this.stopPing();
    if (this.ws) {
      this.send({ type: "leave", playerId: this.playerId });
      this.ws.close();
      this.ws = null;
    }
    this.reset();
  }

  private reset() {
    this.playerId = null;
    this.roomId = null;
    this.roomCode = null;
    this.opponentName = null;
    this.currentRound = 0;
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Keep-alive
      }
    }, 30000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState("error");
      this.emit({ type: "reconnect_failed" });
      return;
    }
    this.reconnectAttempts++;
    setTimeout(() => {
      this.connect().catch(() => {});
    }, 2000 * this.reconnectAttempts);
  }

  // ─── Matchmaking Actions ────────────────────────────────────────────

  joinQueue(playerName: string) {
    this.send({
      type: "join_queue",
      playerId: this.playerId || `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      playerName,
    });
    this.setState("queued");
  }

  createRoom(playerName: string, options: {
    mode: string;
    category: string;
    difficulty: string;
    language: string;
  }) {
    const id = `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.send({
      type: "create_room",
      playerId: id,
      playerName,
      ...options,
    });
    this.setState("creating_room");
  }

  joinRoom(playerName: string, roomCode: string) {
    const id = `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.send({
      type: "join_room",
      playerId: id,
      playerName,
      roomCode: roomCode.toUpperCase(),
    });
  }

  sendReady() {
    this.send({ type: "ready", playerId: this.playerId });
  }

  submitRoundResult(score: number, time: number, transcript: string) {
    this.send({
      type: "round_result",
      playerId: this.playerId,
      score,
      time,
      transcript,
    });
    this.setState("scoring");
  }

  leave() {
    this.send({ type: "leave", playerId: this.playerId });
    this.disconnect();
  }

  // ─── Voice Streaming ─────────────────────────────────────────────

  sendVoiceAudio(audioChunk: string, speaking: boolean) {
    this.send({
      type: "voice_audio",
      playerId: this.playerId,
      audioChunk,
      speaking,
    });
  }

  sendSpeakingState(speaking: boolean) {
    this.send({
      type: "voice_audio",
      playerId: this.playerId,
      audioChunk: null,
      speaking,
    });
  }

  // ─── Message Handling ───────────────────────────────────────────────

  private handleServerMessage(data: any) {
    switch (data.type) {
      case "queued":
        this.playerId = data.playerId;
        this.emit({ type: "queued", position: data.position });
        break;

      case "room_created":
        this.playerId = data.playerId;
        this.roomId = data.roomId;
        this.roomCode = data.roomCode;
        this.setState("waiting_for_opponent");
        this.emit({
          type: "room_created",
          roomCode: data.roomCode,
          roomId: data.roomId,
        });
        break;

      case "matched":
        this.playerId = data.playerId;
        this.roomId = data.roomId;
        this.roomCode = data.roomCode;
        this.opponentName = data.opponent;
        this.totalRounds = data.totalRounds || 5;
        this.setState("matched");
        this.emit({
          type: "matched",
          opponent: data.opponent,
          mode: data.mode,
          category: data.category,
          difficulty: data.difficulty,
          totalRounds: data.totalRounds,
        });
        break;

      case "opponent_joined":
        this.opponentName = data.opponent;
        this.setState("matched");
        this.emit({ type: "opponent_joined", opponent: data.opponent });
        break;

      case "round_start":
        this.currentRound = data.round;
        this.totalRounds = data.totalRounds;
        this.setState("playing");
        this.emit({
          type: "round_start",
          round: data.round,
          totalRounds: data.totalRounds,
          mode: data.mode,
          category: data.category,
        });
        break;

      case "round_scored":
        this.setState("round_result");
        this.emit({
          type: "round_scored",
          round: data.round,
          results: data.results as MultiplayerRoundResult[],
        });
        break;

      case "match_complete":
        this.setState("complete");
        this.emit({
          type: "match_complete",
          winner: data.winner,
          isTie: data.isTie,
          finalScores: data.finalScores,
        } as MultiplayerEvent & MatchCompleteData);
        break;

      case "opponent_left":
        this.setState("complete");
        this.emit({ type: "opponent_left", message: data.message });
        break;

      case "opponent_disconnected":
        this.emit({ type: "opponent_disconnected" });
        break;

      case "voice_audio":
        this.emit({
          type: "voice_audio",
          playerId: data.playerId,
          playerName: data.playerName,
          audioChunk: data.audioChunk,
          speaking: data.speaking,
        });
        break;

      case "error":
        this.emit({ type: "error", message: data.message });
        break;
    }
  }

  // ─── Event System ───────────────────────────────────────────────────

  on(event: string, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: EventListener) {
    const list = this.listeners.get(event);
    if (list) {
      const idx = list.indexOf(listener);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  private emit(event: MultiplayerEvent) {
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(l => l(event));
    // Also emit to wildcard listeners
    const wildcardListeners = this.listeners.get("*") || [];
    wildcardListeners.forEach(l => l(event));
  }

  // ─── State Management ───────────────────────────────────────────────

  private setState(newState: MultiplayerState) {
    const oldState = this.state;
    this.state = newState;
    this.emit({ type: "state_change", from: oldState, to: newState });
  }

  getState(): MultiplayerState {
    return this.state;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  getRoomCode(): string | null {
    return this.roomCode;
  }

  getOpponentName(): string | null {
    return this.opponentName;
  }

  getCurrentRound(): number {
    return this.currentRound;
  }

  getTotalRounds(): number {
    return this.totalRounds;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // ─── Internal ───────────────────────────────────────────────────────

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

// ─── Singleton Instance ─────────────────────────────────────────────────────

let clientInstance: DuelMultiplayerClient | null = null;

export function getDuelMultiplayerClient(): DuelMultiplayerClient {
  if (!clientInstance) {
    clientInstance = new DuelMultiplayerClient();
  }
  return clientInstance;
}

export function resetDuelMultiplayerClient() {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}
