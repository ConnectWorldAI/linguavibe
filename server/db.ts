import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, pushTokens, InsertPushToken } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Push Token Functions ────────────────────────────────────────────────────

/**
 * Register or update a push token for a user.
 * Uses upsert on the unique token index — if the same token already exists,
 * updates the userId, platform, and deviceName (device may have changed user).
 */
export async function upsertPushToken(data: {
  userId: number;
  token: string;
  platform: "ios" | "android" | "web";
  deviceName?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert push token: database not available");
    return;
  }

  try {
    await db.insert(pushTokens).values({
      userId: data.userId,
      token: data.token,
      platform: data.platform,
      deviceName: data.deviceName ?? null,
      active: 1,
    }).onDuplicateKeyUpdate({
      set: {
        userId: data.userId,
        platform: data.platform,
        deviceName: data.deviceName ?? null,
        active: 1,
      },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert push token:", error);
  }
}

/**
 * Get all active push tokens for a user.
 */
export async function getUserPushTokens(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.active, 1)));

  return results.map((r) => r.token);
}

/**
 * Deactivate a push token (e.g., when Expo returns an error for it).
 */
export async function deactivatePushToken(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(pushTokens).set({ active: 0 }).where(eq(pushTokens.token, token));
}

/**
 * Get all active push tokens (for broadcast notifications).
 */
export async function getAllActivePushTokens(): Promise<Array<{ userId: number; token: string }>> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({ userId: pushTokens.userId, token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.active, 1));
}
