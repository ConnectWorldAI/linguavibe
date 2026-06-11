/**
 * Duel Matchmaking WebSocket Server
 *
 * Real-time matchmaking for pronunciation duels.
 * Handles room creation, pairing, round synchronization, and scoring.
 *
 * Protocol:
 * - Client sends: { type: "join_queue" | "create_room" | "join_room" | "round_result" | "leave", ... }
 * - Server sends: { type: "matched" | "room_created" | "round_start" | "round_scored" | "match_complete" | "error", ... }
 */
import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DuelPlayer {
  id: string;
  name: string;
  ws: WebSocket;
  score: number;
  roundScores: number[];
  ready: boolean;
  connected: boolean;
}

export interface DuelRoom {
  id: string;
  code: string; // 6-char invite code
  mode: string;
  category: string;
  difficulty: string;
  language: string;
  totalRounds: number;
  currentRound: number;
  players: DuelPlayer[];
  state: "waiting" | "countdown" | "playing" | "scoring" | "complete";
  words: any[];
  createdAt: number;
  roundResults: Map<string, { score: number; time: number; transcript: string }>;
}

interface ClientMessage {
  type: "join_queue" | "create_room" | "join_room" | "round_result" | "ready" | "leave" | "voice_audio";
  playerId?: string;
  playerName?: string;
  mode?: string;
  category?: string;
  difficulty?: string;
  language?: string;
  roomCode?: string;
  score?: number;
  time?: number;
  transcript?: string;
  audioChunk?: string; // base64-encoded audio data
  speaking?: boolean; // voice activity indicator
}

// ─── State ──────────────────────────────────────────────────────────────────

const rooms = new Map<string, DuelRoom>();
const playerRooms = new Map<string, string>(); // playerId -> roomId
const matchmakingQueue: DuelPlayer[] = [];

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateId(): string {
  return `duel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function broadcast(room: DuelRoom, message: any, excludeId?: string) {
  const data = JSON.stringify(message);
  room.players.forEach(p => {
    if (p.id !== excludeId && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(data);
    }
  });
}

function sendTo(player: DuelPlayer, message: any) {
  if (player.ws.readyState === WebSocket.OPEN) {
    player.ws.send(JSON.stringify(message));
  }
}

function cleanupRoom(roomId: string) {
  const room = rooms.get(roomId);
  if (room) {
    room.players.forEach(p => playerRooms.delete(p.id));
    rooms.delete(roomId);
  }
}

// Clean up stale rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, id) => {
    if (now - room.createdAt > 30 * 60 * 1000) { // 30 min timeout
      cleanupRoom(id);
    }
  });
}, 5 * 60 * 1000);

// ─── Matchmaking Logic ──────────────────────────────────────────────────────

function tryMatchFromQueue() {
  if (matchmakingQueue.length < 2) return;

  // Simple FIFO pairing — match first two in queue
  const player1 = matchmakingQueue.shift()!;
  const player2 = matchmakingQueue.shift()!;

  const roomId = generateId();
  const room: DuelRoom = {
    id: roomId,
    code: generateRoomCode(),
    mode: "word_flash",
    category: "mixed",
    difficulty: "medium",
    language: "Spanish",
    totalRounds: 5,
    currentRound: 0,
    players: [
      { ...player1, score: 0, roundScores: [], ready: false, connected: true },
      { ...player2, score: 0, roundScores: [], ready: false, connected: true },
    ],
    state: "waiting",
    words: [],
    createdAt: Date.now(),
    roundResults: new Map(),
  };

  rooms.set(roomId, room);
  playerRooms.set(player1.id, roomId);
  playerRooms.set(player2.id, roomId);

  // Notify both players
  const matchInfo = {
    type: "matched",
    roomId,
    roomCode: room.code,
    mode: room.mode,
    category: room.category,
    difficulty: room.difficulty,
    totalRounds: room.totalRounds,
  };

  sendTo(player1, { ...matchInfo, opponent: player2.name, playerId: player1.id });
  sendTo(player2, { ...matchInfo, opponent: player1.name, playerId: player2.id });
}

function handleCreateRoom(ws: WebSocket, msg: ClientMessage) {
  const playerId = msg.playerId || generateId();
  const roomId = generateId();
  const code = generateRoomCode();

  const player: DuelPlayer = {
    id: playerId,
    name: msg.playerName || "Player 1",
    ws,
    score: 0,
    roundScores: [],
    ready: false,
    connected: true,
  };

  const room: DuelRoom = {
    id: roomId,
    code,
    mode: msg.mode || "word_flash",
    category: msg.category || "mixed",
    difficulty: msg.difficulty || "medium",
    language: msg.language || "Spanish",
    totalRounds: 5,
    currentRound: 0,
    players: [player],
    state: "waiting",
    words: [],
    createdAt: Date.now(),
    roundResults: new Map(),
  };

  rooms.set(roomId, room);
  playerRooms.set(playerId, roomId);

  sendTo(player, {
    type: "room_created",
    roomId,
    roomCode: code,
    playerId,
    mode: room.mode,
    category: room.category,
    difficulty: room.difficulty,
  });
}

function handleJoinRoom(ws: WebSocket, msg: ClientMessage) {
  const code = msg.roomCode?.toUpperCase();
  if (!code) {
    ws.send(JSON.stringify({ type: "error", message: "Room code required" }));
    return;
  }

  let targetRoom: DuelRoom | undefined;
  rooms.forEach(room => {
    if (room.code === code && room.state === "waiting" && room.players.length < 2) {
      targetRoom = room;
    }
  });

  if (!targetRoom) {
    ws.send(JSON.stringify({ type: "error", message: "Room not found or full" }));
    return;
  }

  const playerId = msg.playerId || generateId();
  const player: DuelPlayer = {
    id: playerId,
    name: msg.playerName || "Player 2",
    ws,
    score: 0,
    roundScores: [],
    ready: false,
    connected: true,
  };

  targetRoom.players.push(player);
  playerRooms.set(playerId, targetRoom.id);

  // Notify joiner
  sendTo(player, {
    type: "matched",
    roomId: targetRoom.id,
    roomCode: targetRoom.code,
    playerId,
    opponent: targetRoom.players[0].name,
    mode: targetRoom.mode,
    category: targetRoom.category,
    difficulty: targetRoom.difficulty,
    totalRounds: targetRoom.totalRounds,
  });

  // Notify host
  sendTo(targetRoom.players[0], {
    type: "opponent_joined",
    opponent: player.name,
    playerId: targetRoom.players[0].id,
  });
}

function handleReady(ws: WebSocket, msg: ClientMessage) {
  const playerId = msg.playerId;
  if (!playerId) return;

  const roomId = playerRooms.get(playerId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.find(p => p.id === playerId);
  if (player) player.ready = true;

  // Check if both players are ready
  if (room.players.length === 2 && room.players.every(p => p.ready)) {
    room.state = "countdown";
    room.currentRound = 1;

    broadcast(room, {
      type: "round_start",
      round: room.currentRound,
      totalRounds: room.totalRounds,
      mode: room.mode,
      category: room.category,
    });
  }
}

function handleRoundResult(ws: WebSocket, msg: ClientMessage) {
  const playerId = msg.playerId;
  if (!playerId) return;

  const roomId = playerRooms.get(playerId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  // Store this player's round result
  room.roundResults.set(playerId, {
    score: msg.score || 0,
    time: msg.time || 0,
    transcript: msg.transcript || "",
  });

  // Check if both players submitted
  if (room.roundResults.size === room.players.length) {
    room.state = "scoring";

    // Calculate round scores
    const results: any[] = [];
    room.players.forEach(p => {
      const result = room.roundResults.get(p.id);
      if (result) {
        p.score += result.score;
        p.roundScores.push(result.score);
        results.push({
          playerId: p.id,
          playerName: p.name,
          score: result.score,
          time: result.time,
          totalScore: p.score,
        });
      }
    });

    // Broadcast round results
    broadcast(room, {
      type: "round_scored",
      round: room.currentRound,
      results,
    });

    room.roundResults.clear();

    // Check if match is complete
    if (room.currentRound >= room.totalRounds) {
      room.state = "complete";
      const sorted = [...room.players].sort((a, b) => b.score - a.score);
      const winner = sorted[0].score > sorted[1].score ? sorted[0] : null;
      const isTie = sorted[0].score === sorted[1].score;

      broadcast(room, {
        type: "match_complete",
        winner: isTie ? null : { id: winner!.id, name: winner!.name },
        isTie,
        finalScores: room.players.map(p => ({
          playerId: p.id,
          playerName: p.name,
          totalScore: p.score,
          roundScores: p.roundScores,
        })),
      });

      // Cleanup after 30 seconds
      setTimeout(() => cleanupRoom(room.id), 30000);
    } else {
      // Advance to next round after 3 second delay
      room.currentRound++;
      room.state = "playing";
      setTimeout(() => {
        broadcast(room, {
          type: "round_start",
          round: room.currentRound,
          totalRounds: room.totalRounds,
          mode: room.mode,
          category: room.category,
        });
      }, 3000);
    }
  }
}

function handleLeave(ws: WebSocket, msg: ClientMessage) {
  const playerId = msg.playerId;
  if (!playerId) return;

  const roomId = playerRooms.get(playerId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  // Notify opponent
  const opponent = room.players.find(p => p.id !== playerId);
  if (opponent) {
    sendTo(opponent, {
      type: "opponent_left",
      message: "Your opponent has left the duel.",
    });
  }

  cleanupRoom(roomId);
}

// ─── Voice Audio Relay ──────────────────────────────────────────────────────

function handleVoiceAudio(ws: WebSocket, msg: ClientMessage) {
  const playerId = msg.playerId;
  if (!playerId) return;

  const roomId = playerRooms.get(playerId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  // Relay audio chunk and speaking state to the opponent
  const opponent = room.players.find(p => p.id !== playerId && p.connected);
  if (opponent) {
    sendTo(opponent, {
      type: "voice_audio",
      playerId,
      playerName: room.players.find(p => p.id === playerId)?.name || "Opponent",
      audioChunk: msg.audioChunk || null,
      speaking: msg.speaking ?? false,
    });
  }
}

// ─── WebSocket Server Setup ─────────────────────────────────────────────────

export function setupDuelMatchmaking(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/duel" });

  wss.on("connection", (ws: WebSocket) => {
    let currentPlayerId: string | null = null;

    ws.on("message", (data: Buffer) => {
      try {
        const msg: ClientMessage = JSON.parse(data.toString());

        switch (msg.type) {
          case "join_queue": {
            const playerId = msg.playerId || generateId();
            currentPlayerId = playerId;
            const player: DuelPlayer = {
              id: playerId,
              name: msg.playerName || "Anonymous",
              ws,
              score: 0,
              roundScores: [],
              ready: false,
              connected: true,
            };
            matchmakingQueue.push(player);
            sendTo(player, { type: "queued", playerId, position: matchmakingQueue.length });
            tryMatchFromQueue();
            break;
          }
          case "create_room":
            currentPlayerId = msg.playerId || null;
            handleCreateRoom(ws, msg);
            break;
          case "join_room":
            currentPlayerId = msg.playerId || null;
            handleJoinRoom(ws, msg);
            break;
          case "ready":
            handleReady(ws, msg);
            break;
          case "round_result":
            handleRoundResult(ws, msg);
            break;
          case "leave":
            handleLeave(ws, msg);
            break;
          case "voice_audio":
            handleVoiceAudio(ws, msg);
            break;
          default:
            ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
        }
      } catch (err) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      // Remove from queue
      const idx = matchmakingQueue.findIndex(p => p.ws === ws);
      if (idx !== -1) matchmakingQueue.splice(idx, 1);

      // Handle disconnect from active room
      if (currentPlayerId) {
        const roomId = playerRooms.get(currentPlayerId);
        if (roomId) {
          const room = rooms.get(roomId);
          if (room) {
            const player = room.players.find(p => p.id === currentPlayerId);
            if (player) player.connected = false;

            const opponent = room.players.find(p => p.id !== currentPlayerId);
            if (opponent) {
              sendTo(opponent, { type: "opponent_disconnected" });
            }

            // If room is waiting and host disconnects, clean up
            if (room.state === "waiting" || room.players.every(p => !p.connected)) {
              cleanupRoom(roomId);
            }
          }
        }
      }
    });

    ws.on("error", () => {
      // Silently handle errors
    });
  });

  console.log("[DuelMatchmaking] WebSocket server ready at /ws/duel");
  return wss;
}

// ─── Exports for testing ────────────────────────────────────────────────────

export function getActiveRoomCount(): number {
  return rooms.size;
}

export function getQueueLength(): number {
  return matchmakingQueue.length;
}

export function getRoomByCode(code: string): DuelRoom | undefined {
  let found: DuelRoom | undefined;
  rooms.forEach(room => {
    if (room.code === code) found = room;
  });
  return found;
}
