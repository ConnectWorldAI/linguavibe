/**
 * MFA/TOTP Router — Server-side multi-factor authentication
 * 
 * Provides:
 * - TOTP secret generation (base32 encoded)
 * - QR code URI generation (otpauth:// format)
 * - TOTP code verification
 * - Backup codes generation
 * - MFA enable/disable flow
 * 
 * Uses RFC 6238 TOTP algorithm with HMAC-SHA1, 6-digit codes, 30-second period.
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import crypto from "crypto";

// ─── TOTP Constants ───────────────────────────────────────────────────────────
const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = "sha1";
const APP_NAME = "ConnectWorldAI";
const SECRET_LENGTH = 20; // 160 bits

// ─── Base32 Encoding ──────────────────────────────────────────────────────────
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let bits = "";
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    result += BASE32_CHARS[parseInt(chunk, 2)];
  }
  return result;
}

function base32Decode(encoded: string): Buffer {
  let bits = "";
  for (const char of encoded.toUpperCase()) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// ─── TOTP Generation ──────────────────────────────────────────────────────────
function generateTOTP(secret: string, timeStep?: number): string {
  const time = timeStep ?? Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigUInt64BE(BigInt(time));

  const key = base32Decode(secret);
  const hmac = crypto.createHmac(TOTP_ALGORITHM, key);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

function verifyTOTP(secret: string, code: string, window: number = 1): boolean {
  const currentStep = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  for (let i = -window; i <= window; i++) {
    const expected = generateTOTP(secret, currentStep + i);
    if (timingSafeEqual(code, expected)) {
      return true;
    }
  }
  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

// ─── Backup Codes ─────────────────────────────────────────────────────────────
function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    // Format: XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

// ─── In-memory MFA store (production would use DB) ────────────────────────────
interface MFARecord {
  secret: string;
  enabled: boolean;
  backupCodes: string[];
  usedBackupCodes: string[];
  setupCompletedAt?: number;
  lastVerifiedAt?: number;
}

const mfaStore = new Map<string, MFARecord>();

/** Helper to get a string userId from the context */
function getUserId(ctx: { user?: { id: number } | null }): string {
  return ctx.user?.id != null ? String(ctx.user.id) : "anonymous";
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const mfaRouter = router({
  /**
   * Generate a new TOTP secret and return the otpauth:// URI for QR scanning
   */
  setupStart: protectedProcedure
    .input(z.object({
      email: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = getUserId(ctx);
      const email = input.email ?? `user_${userId}@connectworld.ai`;

      // Generate secret
      const secretBuffer = crypto.randomBytes(SECRET_LENGTH);
      const secret = base32Encode(secretBuffer);

      // Build otpauth URI
      const issuer = encodeURIComponent(APP_NAME);
      const account = encodeURIComponent(email);
      const otpauthUri = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;

      // Store pending setup (not yet enabled)
      mfaStore.set(userId, {
        secret,
        enabled: false,
        backupCodes: [],
        usedBackupCodes: [],
      });

      return {
        secret,
        otpauthUri,
        qrData: otpauthUri, // Client can render this as QR code
        manualEntry: {
          key: secret,
          account: email,
          issuer: APP_NAME,
          type: "TOTP",
          digits: TOTP_DIGITS,
          period: TOTP_PERIOD,
        },
      };
    }),

  /**
   * Verify the TOTP code to complete MFA setup
   */
  setupVerify: protectedProcedure
    .input(z.object({
      code: z.string().length(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = getUserId(ctx);
      const record = mfaStore.get(userId);

      if (!record) {
        return { success: false, error: "MFA setup not started. Please start setup first." };
      }

      if (record.enabled) {
        return { success: false, error: "MFA is already enabled." };
      }

      // Verify the code
      const isValid = verifyTOTP(record.secret, input.code);
      if (!isValid) {
        return { success: false, error: "Invalid code. Please try again." };
      }

      // Enable MFA and generate backup codes
      const backupCodes = generateBackupCodes(8);
      record.enabled = true;
      record.backupCodes = backupCodes;
      record.setupCompletedAt = Date.now();
      mfaStore.set(userId, record);

      return {
        success: true,
        backupCodes,
        message: "MFA enabled successfully. Save your backup codes securely.",
      };
    }),

  /**
   * Verify a TOTP code (for login or sensitive actions)
   */
  verify: protectedProcedure
    .input(z.object({
      code: z.string().min(6).max(9), // 6 for TOTP, 9 for backup (XXXX-XXXX)
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = getUserId(ctx);
      const record = mfaStore.get(userId);

      if (!record || !record.enabled) {
        return { success: false, error: "MFA is not enabled for this account." };
      }

      // Check if it's a backup code
      if (input.code.includes("-")) {
        const codeUpper = input.code.toUpperCase();
        if (record.backupCodes.includes(codeUpper) && !record.usedBackupCodes.includes(codeUpper)) {
          record.usedBackupCodes.push(codeUpper);
          record.lastVerifiedAt = Date.now();
          mfaStore.set(userId, record);
          return {
            success: true,
            method: "backup_code" as const,
            remainingBackupCodes: record.backupCodes.length - record.usedBackupCodes.length,
          };
        }
        return { success: false, error: "Invalid or already used backup code." };
      }

      // Verify TOTP
      const isValid = verifyTOTP(record.secret, input.code);
      if (isValid) {
        record.lastVerifiedAt = Date.now();
        mfaStore.set(userId, record);
        return { success: true, method: "totp" as const };
      }

      return { success: false, error: "Invalid code. Please try again." };
    }),

  /**
   * Get MFA status for the current user
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    const userId = getUserId(ctx);
    const record = mfaStore.get(userId);

    if (!record) {
      return {
        enabled: false,
        setupStarted: false,
        backupCodesRemaining: 0,
        lastVerifiedAt: null,
      };
    }

    return {
      enabled: record.enabled,
      setupStarted: true,
      backupCodesRemaining: record.backupCodes.length - record.usedBackupCodes.length,
      lastVerifiedAt: record.lastVerifiedAt ?? null,
      setupCompletedAt: record.setupCompletedAt ?? null,
    };
  }),

  /**
   * Disable MFA (requires current TOTP code for security)
   */
  disable: protectedProcedure
    .input(z.object({
      code: z.string().length(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = getUserId(ctx);
      const record = mfaStore.get(userId);

      if (!record || !record.enabled) {
        return { success: false, error: "MFA is not enabled." };
      }

      // Verify code before disabling
      const isValid = verifyTOTP(record.secret, input.code);
      if (!isValid) {
        return { success: false, error: "Invalid code. Cannot disable MFA without valid verification." };
      }

      mfaStore.delete(userId);
      return { success: true, message: "MFA has been disabled." };
    }),

  /**
   * Regenerate backup codes (requires TOTP verification)
   */
  regenerateBackupCodes: protectedProcedure
    .input(z.object({
      code: z.string().length(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = getUserId(ctx);
      const record = mfaStore.get(userId);

      if (!record || !record.enabled) {
        return { success: false, error: "MFA is not enabled." };
      }

      const isValid = verifyTOTP(record.secret, input.code);
      if (!isValid) {
        return { success: false, error: "Invalid code." };
      }

      const newCodes = generateBackupCodes(8);
      record.backupCodes = newCodes;
      record.usedBackupCodes = [];
      mfaStore.set(userId, record);

      return {
        success: true,
        backupCodes: newCodes,
        message: "New backup codes generated. Previous codes are now invalid.",
      };
    }),
});
