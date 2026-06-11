/**
 * Server-side push notification sender using Expo Push API.
 * Expo's push service is free and doesn't require any API keys.
 * Tokens are in the format: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
 */

import { deactivatePushToken, getUserPushTokens, getAllActivePushTokens } from "./db";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string; // Android notification channel
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * Send a push notification to a single Expo push token.
 */
export async function sendPushToToken(
  token: string,
  message: PushMessage,
): Promise<{ success: boolean; ticketId?: string; error?: string }> {
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        title: message.title,
        body: message.body,
        data: message.data ?? {},
        sound: message.sound ?? "default",
        badge: message.badge,
        channelId: message.channelId ?? "default",
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { success: false, error: `Expo push API error: ${response.status} ${text}` };
    }

    const result = await response.json() as { data: ExpoPushTicket | ExpoPushTicket[] };
    const ticket = Array.isArray(result.data) ? result.data[0] : result.data;

    if (ticket.status === "error") {
      // If the token is invalid, deactivate it
      if (ticket.details?.error === "DeviceNotRegistered") {
        await deactivatePushToken(token);
      }
      return { success: false, error: ticket.message ?? "Unknown push error" };
    }

    return { success: true, ticketId: ticket.id };
  } catch (error: any) {
    return { success: false, error: error.message ?? "Failed to send push" };
  }
}

/**
 * Send a push notification to all of a user's registered devices.
 */
export async function sendPushToUser(
  userId: number,
  message: PushMessage,
): Promise<{ sent: number; failed: number }> {
  const tokens = await getUserPushTokens(userId);
  if (tokens.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  // Expo supports batch sending (up to 100 per request)
  const chunks = chunkArray(tokens, 100);
  for (const chunk of chunks) {
    try {
      const messages = chunk.map((token) => ({
        to: token,
        title: message.title,
        body: message.body,
        data: message.data ?? {},
        sound: message.sound ?? "default",
        badge: message.badge,
        channelId: message.channelId ?? "default",
      }));

      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        failed += chunk.length;
        continue;
      }

      const result = await response.json() as { data: ExpoPushTicket[] };
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i];
        if (ticket.status === "ok") {
          sent++;
        } else {
          failed++;
          if (ticket.details?.error === "DeviceNotRegistered") {
            await deactivatePushToken(chunk[i]);
          }
        }
      }
    } catch {
      failed += chunk.length;
    }
  }

  return { sent, failed };
}

/**
 * Broadcast a push notification to all registered users.
 */
export async function broadcastPush(
  message: PushMessage,
): Promise<{ sent: number; failed: number }> {
  const allTokens = await getAllActivePushTokens();
  if (allTokens.length === 0) return { sent: 0, failed: 0 };

  const tokens = allTokens.map((t) => t.token);
  let sent = 0;
  let failed = 0;

  const chunks = chunkArray(tokens, 100);
  for (const chunk of chunks) {
    try {
      const messages = chunk.map((token) => ({
        to: token,
        title: message.title,
        body: message.body,
        data: message.data ?? {},
        sound: message.sound ?? "default",
        badge: message.badge,
        channelId: message.channelId ?? "default",
      }));

      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        failed += chunk.length;
        continue;
      }

      const result = await response.json() as { data: ExpoPushTicket[] };
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i];
        if (ticket.status === "ok") {
          sent++;
        } else {
          failed++;
          if (ticket.details?.error === "DeviceNotRegistered") {
            await deactivatePushToken(chunk[i]);
          }
        }
      }
    } catch {
      failed += chunk.length;
    }
  }

  return { sent, failed };
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
