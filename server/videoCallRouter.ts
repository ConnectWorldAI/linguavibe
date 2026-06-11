import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import twilio from "twilio";
import { sendPushToUser } from "./pushNotifications";

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
} = process.env;

// Generate a Twilio API Key for Video access tokens (cached in memory)
let cachedApiKey: { sid: string; secret: string } | null = null;

async function getOrCreateApiKey() {
  if (cachedApiKey) return cachedApiKey;

  const client = twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);
  const key = await client.newKeys.create({ friendlyName: "ConnectWorld AI Video Key" });
  cachedApiKey = { sid: key.sid, secret: key.secret! };
  return cachedApiKey;
}

function generateVideoToken(identity: string, roomName: string): string {
  const AccessToken = twilio.jwt.AccessToken;
  const VideoGrant = AccessToken.VideoGrant;

  // Use API Key for token generation
  // For trial accounts, we use the account SID and auth token directly
  const token = new AccessToken(
    TWILIO_ACCOUNT_SID!,
    TWILIO_ACCOUNT_SID!, // API Key SID (using account SID for trial)
    TWILIO_AUTH_TOKEN!, // API Key Secret (using auth token for trial)
    { identity, ttl: 3600 }
  );

  const videoGrant = new VideoGrant({ room: roomName });
  token.addGrant(videoGrant);

  return token.toJwt();
}

// In-memory call state (in production, use Redis or DB)
const activeCalls = new Map<string, {
  roomName: string;
  callerId: number;
  callerName: string;
  calleeId: number;
  calleeName: string;
  type: "video" | "voice";
  status: "ringing" | "active" | "ended";
  startedAt: number;
  answeredAt?: number;
  endedAt?: number;
}>();

const callHistory = new Map<number, Array<{
  id: string;
  roomName: string;
  otherUserId: number;
  otherUserName: string;
  type: "video" | "voice";
  direction: "outgoing" | "incoming";
  status: "completed" | "missed" | "declined";
  duration: number; // seconds
  timestamp: number;
}>>();

export const videoCallRouter = router({
  // Create a video/voice call room and get access token
  createRoom: protectedProcedure
    .input(z.object({
      calleeId: z.number(), // User ID to call
      calleeName: z.string().default("User"),
      type: z.enum(["video", "voice"]).default("video"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        return { success: false as const, error: "Twilio not configured" };
      }

      const roomName = `connectworld-${ctx.user.id}-${input.calleeId}-${Date.now()}`;
      const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Generate token for the caller
      const token = generateVideoToken(
        `user-${ctx.user.id}`,
        roomName
      );

      // Store active call
      activeCalls.set(callId, {
        roomName,
        callerId: ctx.user.id,
        callerName: ctx.user.name || "Unknown",
        calleeId: input.calleeId,
        calleeName: input.calleeName,
        type: input.type,
        status: "ringing",
        startedAt: Date.now(),
      });

      // Send push notification to callee (fire-and-forget)
      const callerDisplayName = ctx.user.name || "Someone";
      sendPushToUser(input.calleeId, {
        title: `Incoming ${input.type === "video" ? "Video" : "Voice"} Call`,
        body: `${callerDisplayName} is calling you`,
        sound: "default",
        data: {
          type: "incoming_call",
          callId,
          roomName,
          callerId: ctx.user.id,
          callerName: callerDisplayName,
          callType: input.type,
          url: `/video-call?callId=${callId}&incoming=true&callerName=${encodeURIComponent(callerDisplayName)}&type=${input.type}`,
        },
        channelId: "calls",
      }).catch((err) => {
        console.warn("[VideoCall] Failed to send push to callee:", err);
      });

      return {
        success: true as const,
        callId,
        roomName,
        token,
        type: input.type,
      };
    }),

  // Join an existing call (for the callee)
  joinCall: protectedProcedure
    .input(z.object({
      callId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const call = activeCalls.get(input.callId);
      if (!call) {
        return { success: false as const, error: "Call not found or expired" };
      }

      if (call.calleeId !== ctx.user.id) {
        return { success: false as const, error: "This call is not for you" };
      }

      // Generate token for the callee
      const token = generateVideoToken(
        `user-${ctx.user.id}`,
        call.roomName
      );

      // Update call status
      call.status = "active";
      call.answeredAt = Date.now();

      return {
        success: true as const,
        roomName: call.roomName,
        token,
        type: call.type,
        callerName: call.callerName,
      };
    }),

  // End a call
  endCall: protectedProcedure
    .input(z.object({
      callId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const call = activeCalls.get(input.callId);
      if (!call) {
        return { success: true as const, message: "Call already ended" };
      }

      call.status = "ended";
      call.endedAt = Date.now();

      const duration = call.answeredAt
        ? Math.round((Date.now() - call.answeredAt) / 1000)
        : 0;

      // Add to call history for both users
      const callerHistory = callHistory.get(call.callerId) || [];
      callerHistory.unshift({
        id: input.callId,
        roomName: call.roomName,
        otherUserId: call.calleeId,
        otherUserName: call.calleeName,
        type: call.type,
        direction: "outgoing",
        status: call.answeredAt ? "completed" : "missed",
        duration,
        timestamp: call.startedAt,
      });
      callHistory.set(call.callerId, callerHistory.slice(0, 50));

      const calleeHistory = callHistory.get(call.calleeId) || [];
      calleeHistory.unshift({
        id: input.callId,
        roomName: call.roomName,
        otherUserId: call.callerId,
        otherUserName: call.callerName,
        type: call.type,
        direction: "incoming",
        status: call.answeredAt ? "completed" : "missed",
        duration,
        timestamp: call.startedAt,
      });
      callHistory.set(call.calleeId, calleeHistory.slice(0, 50));

      // Clean up active call
      activeCalls.delete(input.callId);

      return { success: true as const, duration };
    }),

  // Decline a call
  declineCall: protectedProcedure
    .input(z.object({
      callId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const call = activeCalls.get(input.callId);
      if (!call) {
        return { success: true as const };
      }

      call.status = "ended";
      call.endedAt = Date.now();

      // Add to history as declined
      const callerHistory = callHistory.get(call.callerId) || [];
      callerHistory.unshift({
        id: input.callId,
        roomName: call.roomName,
        otherUserId: call.calleeId,
        otherUserName: call.calleeName,
        type: call.type,
        direction: "outgoing",
        status: "declined",
        duration: 0,
        timestamp: call.startedAt,
      });
      callHistory.set(call.callerId, callerHistory.slice(0, 50));

      const calleeHistory = callHistory.get(call.calleeId) || [];
      calleeHistory.unshift({
        id: input.callId,
        roomName: call.roomName,
        otherUserId: call.callerId,
        otherUserName: call.callerName,
        type: call.type,
        direction: "incoming",
        status: "declined",
        duration: 0,
        timestamp: call.startedAt,
      });
      callHistory.set(call.calleeId, calleeHistory.slice(0, 50));

      activeCalls.delete(input.callId);
      return { success: true as const };
    }),

  // Check for incoming calls
  checkIncoming: protectedProcedure
    .query(({ ctx }) => {
      const incoming: Array<{
        callId: string;
        callerName: string;
        callerId: number;
        type: "video" | "voice";
      }> = [];

      for (const [callId, call] of activeCalls.entries()) {
        if (call.calleeId === ctx.user.id && call.status === "ringing") {
          incoming.push({
            callId,
            callerName: call.callerName,
            callerId: call.callerId,
            type: call.type,
          });
        }
      }

      return { incoming };
    }),

  // Get call history
  getHistory: protectedProcedure
    .query(({ ctx }) => {
      const history = callHistory.get(ctx.user.id) || [];
      return { calls: history };
    }),

  // Create an AI teacher call room (no real callee, AI-powered)
  createAITeacherRoom: protectedProcedure
    .input(z.object({
      teacherName: z.string(),
      language: z.string(),
      dialect: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        return { success: false as const, error: "Twilio not configured" };
      }

      const roomName = `ai-teacher-${ctx.user.id}-${Date.now()}`;

      const token = generateVideoToken(
        `user-${ctx.user.id}`,
        roomName
      );

      return {
        success: true as const,
        roomName,
        token,
        teacherName: input.teacherName,
        language: input.language,
        dialect: input.dialect,
      };
    }),

  // Get a token for an existing room (reconnection)
  getToken: protectedProcedure
    .input(z.object({
      roomName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        return { success: false as const, error: "Twilio not configured" };
      }

      const token = generateVideoToken(
        `user-${ctx.user.id}`,
        input.roomName
      );

      return { success: true as const, token };
    }),
});
