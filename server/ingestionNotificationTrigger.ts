/**
 * Server-Side Ingestion Notification Trigger
 *
 * Sends a push notification to the app owner when the auto-ingest pipeline
 * discovers and successfully processes new creator content.
 *
 * This uses the server's built-in notifyOwner() to deliver server-side
 * push notifications. The client-side creator-content-notifications.ts
 * handles local notifications for the mobile app.
 */
import { notifyOwner } from "./_core/notification";

export interface IngestionNotificationPayload {
  channelsChecked: number;
  newContentFound: number;
  successfullyIngested: number;
  /** Channel names that had new content */
  channelsWithNewContent: string[];
}

/**
 * Send a server-side push notification summarizing ingestion results.
 * Only fires if new content was actually ingested.
 */
export async function notifyIngestionResults(
  payload: IngestionNotificationPayload
): Promise<boolean> {
  if (payload.successfullyIngested === 0) return false;

  const channelList = payload.channelsWithNewContent.length > 0
    ? payload.channelsWithNewContent.join(", ")
    : "various channels";

  const title = `New creator content ingested (${payload.successfullyIngested} items)`;
  const content = [
    `Auto-ingest completed: checked ${payload.channelsChecked} channels.`,
    `Found ${payload.newContentFound} new items, successfully ingested ${payload.successfullyIngested}.`,
    `New content from: ${channelList}.`,
    `Your AI teachers now have fresh, up-to-date knowledge from these creators.`,
  ].join("\n");

  try {
    return await notifyOwner({ title, content });
  } catch (error) {
    console.warn("[IngestionNotif] Failed to send notification:", error);
    return false;
  }
}
