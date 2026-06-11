import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import crypto from "crypto";

// In-memory store for invites (in production, use database)
const invites = new Map<string, {
  code: string;
  senderUserId: string;
  senderName: string;
  createdAt: Date;
  acceptedBy?: string;
  type: "call" | "message" | "general";
}>();

export const inviteRouter = router({
  /**
   * Generate an invite link for a user to share
   */
  generate: protectedProcedure
    .input(z.object({
      type: z.enum(["call", "message", "general"]).default("general"),
      senderName: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const code = crypto.randomBytes(6).toString("hex"); // 12-char code
      const userId = String(ctx.user?.id || "anonymous");
      
      invites.set(code, {
        code,
        senderUserId: userId,
        senderName: input.senderName,
        createdAt: new Date(),
        type: input.type,
      });

      // The invite URL - in production this would be your domain
      const inviteUrl = `https://connectworld.ai/invite/${code}`;
      
      return {
        code,
        url: inviteUrl,
        shareMessage: `${input.senderName} invited you to ConnectWorld AI — learn languages together with free calling & translation! Join here: ${inviteUrl}`,
        // Open Graph metadata for rich link previews
        ogMetadata: {
          title: "ConnectWorld AI — Learn Languages Together",
          description: `${input.senderName} wants to connect with you on ConnectWorld AI. Free WiFi calling, messaging, and real-time translation.`,
          image: "https://connectworld.ai/og-image.png", // Logo for link preview
          url: inviteUrl,
        },
      };
    }),

  /**
   * Validate an invite code
   */
  validate: publicProcedure
    .input(z.object({
      code: z.string(),
    }))
    .query(async ({ input }) => {
      const invite = invites.get(input.code);
      if (!invite) {
        return { valid: false, error: "Invalid invite code" };
      }
      return {
        valid: true,
        senderName: invite.senderName,
        type: invite.type,
        createdAt: invite.createdAt.toISOString(),
      };
    }),

  /**
   * Accept an invite (called after new user signs up via invite link)
   */
  accept: protectedProcedure
    .input(z.object({
      code: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const invite = invites.get(input.code);
      if (!invite) {
        return { success: false, error: "Invalid invite code" };
      }
      invite.acceptedBy = String(ctx.user?.id || "unknown");
      return {
        success: true,
        senderName: invite.senderName,
        type: invite.type,
      };
    }),
});
