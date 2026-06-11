import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

// Resend integration (preferred for production)
async function sendWithResend(to: string, subject: string, html: string): Promise<boolean> {
  if (!ENV.resendApiKey) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ENV.emailFromAddress.includes("<") ? ENV.emailFromAddress : `ConnectWorld AI <${ENV.emailFromAddress}>`,
        to: [to],
        subject,
        html,
      }),
    });
    if (res.ok) {
      console.log("[Auth] Email sent via Resend to:", to);
      return true;
    }
    const err = await res.text();
    console.error("[Auth] Resend error:", err);
    return false;
  } catch (e) {
    console.error("[Auth] Resend fetch error:", e);
    return false;
  }
}

// In-memory store for verification codes (in production, use Redis/DB)
const verificationCodes = new Map<string, { code: string; expiresAt: number; name: string; password: string }>();
const resetCodes = new Map<string, { code: string; expiresAt: number }>();
const usernames = new Set<string>(); // Track taken usernames

// Create a transporter - uses environment SMTP settings or falls back to ethereal
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;
  
  // Check for SMTP env vars
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || "587"),
      secure: (smtpPort || "587") === "465",
      auth: { user: smtpUser, pass: smtpPass },
    });
  } else {
    // Fallback: create test account (logs to console in dev)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }
  return transporter;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authRouter = router({
  // Send verification code to email
  sendVerification: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(2),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const code = generateCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      // Store code with user data
      verificationCodes.set(input.email.toLowerCase(), {
        code,
        expiresAt,
        name: input.name,
        password: input.password,
      });
      
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0a7ea4; font-size: 24px; margin: 0;">ConnectWorld AI</h1>
            <p style="color: #687076; margin-top: 8px;">Verify your email address</p>
          </div>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="color: #11181C; font-size: 16px; margin: 0 0 16px;">Your verification code is:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0a7ea4; padding: 16px; background: white; border-radius: 8px; display: inline-block;">
              ${code}
            </div>
            <p style="color: #687076; font-size: 14px; margin-top: 16px;">This code expires in 10 minutes.</p>
          </div>
          <p style="color: #687076; font-size: 12px; text-align: center; margin-top: 24px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `;
      const emailSubject = "Your ConnectWorld AI Verification Code";

      // Try Resend first (production-ready)
      const sentViaResend = await sendWithResend(input.email, emailSubject, emailHtml);
      if (sentViaResend) {
        return { success: true, message: "Verification code sent" };
      }

      // Fallback to nodemailer/SMTP
      try {
        const transport = await getTransporter();
        const info = await transport.sendMail({
          from: '"ConnectWorld AI" <noreply@connectworldai.com>',
          to: input.email,
          subject: emailSubject,
          html: emailHtml,
        });
        
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log("[Auth] Email preview URL (Ethereal):", previewUrl);
          console.log(`[Auth] DEV MODE - Verification code for ${input.email}: ${code}`);
        }
        
        return { success: true, message: "Verification code sent" };
      } catch (error) {
        console.error("[Auth] Failed to send email:", error);
        console.log(`[Auth] DEV MODE - Verification code for ${input.email}: ${code}`);
        return { success: true, message: "Verification code sent", devCode: !ENV.isProduction ? code : undefined };
      }
    }),
    
  // Verify the code
  verifyCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
      code: z.string().length(6),
    }))
    .mutation(async ({ input }) => {
      const stored = verificationCodes.get(input.email.toLowerCase());
      
      if (!stored) {
        return { success: false, error: "No verification code found. Please request a new one." };
      }
      
      if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(input.email.toLowerCase());
        return { success: false, error: "Code expired. Please request a new one." };
      }
      
      if (stored.code !== input.code) {
        return { success: false, error: "Invalid code. Please try again." };
      }
      
      // Code is valid - clean up
      verificationCodes.delete(input.email.toLowerCase());
      
      return { 
        success: true, 
        user: { email: input.email, name: stored.name },
      };
    }),
    
  // Check username availability
  checkUsername: publicProcedure
    .input(z.object({ username: z.string().min(3).max(30) }))
    .query(({ input }) => {
      const normalized = input.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
      const taken = usernames.has(normalized);
      return { available: !taken, normalized };
    }),
    
  // Register username
  registerUsername: publicProcedure
    .input(z.object({ 
      email: z.string().email(),
      username: z.string().min(3).max(30),
    }))
    .mutation(({ input }) => {
      const normalized = input.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (usernames.has(normalized)) {
        return { success: false, error: "Username already taken" };
      }
      usernames.add(normalized);
      return { success: true, username: normalized };
    }),
    
  // Send password reset code
  sendResetCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const code = generateCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      resetCodes.set(input.email.toLowerCase(), { code, expiresAt });

      const resetHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0a7ea4; font-size: 24px; margin: 0;">ConnectWorld AI</h1>
            <p style="color: #687076; margin-top: 8px;">Password Reset</p>
          </div>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="color: #11181C; font-size: 16px; margin: 0 0 16px;">Your reset code is:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0a7ea4; padding: 16px; background: white; border-radius: 8px; display: inline-block;">
              ${code}
            </div>
            <p style="color: #687076; font-size: 14px; margin-top: 16px;">This code expires in 10 minutes.</p>
          </div>
        </div>
      `;
      const resetSubject = "Your ConnectWorld AI Password Reset Code";

      // Try Resend first
      const sentViaResend = await sendWithResend(input.email, resetSubject, resetHtml);
      if (sentViaResend) {
        return { success: true, message: "Reset code sent to your email" };
      }

      // Fallback to nodemailer
      try {
        const transport = await getTransporter();
        const info = await transport.sendMail({
          from: '"ConnectWorld AI" <noreply@connectworldai.com>',
          to: input.email,
          subject: resetSubject,
          html: resetHtml,
        });
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) console.log("[Auth] Reset email preview:", previewUrl);
        return { success: true, message: "Reset code sent to your email" };
      } catch (error) {
        console.error("[Auth] Failed to send reset email:", error);
        console.log(`[Auth] DEV MODE - Reset code for ${input.email}: ${code}`);
        return { success: true, message: "Reset code sent (check console in dev)" };
      }
    }),

  // Verify reset code and allow password change
  verifyResetCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
      code: z.string().length(6),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const stored = resetCodes.get(input.email.toLowerCase());
      if (!stored) {
        return { success: false, error: "No reset code found. Please request a new one." };
      }
      if (Date.now() > stored.expiresAt) {
        resetCodes.delete(input.email.toLowerCase());
        return { success: false, error: "Code expired. Please request a new one." };
      }
      if (stored.code !== input.code) {
        return { success: false, error: "Invalid code. Please try again." };
      }
      // Code valid - clean up
      resetCodes.delete(input.email.toLowerCase());
      // Return success - client will update the local password
      return { success: true, message: "Password reset successful" };
    }),

  // Generate invite link
  generateInviteLink: publicProcedure
    .input(z.object({
      inviterName: z.string(),
      inviterUsername: z.string().optional(),
    }))
    .mutation(({ input }) => {
      // Generate a unique invite code
      const inviteCode = Math.random().toString(36).substring(2, 10);
      // In production this would be stored in DB. For now return the deep link URL.
      const inviteUrl = `https://connectworldai.com/invite/${inviteCode}?ref=${encodeURIComponent(input.inviterName)}`;
      return { 
        inviteUrl, 
        inviteCode,
        ogTitle: "Join me on ConnectWorld AI",
        ogDescription: `${input.inviterName} invited you to learn languages together with free calling & translation`,
        ogImage: "https://connectworldai.com/og-image.png",
      };
    }),
});
