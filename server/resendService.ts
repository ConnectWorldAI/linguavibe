/**
 * Resend Email Service
 * 
 * Server-side email service using Resend API.
 * Used for: Welcome emails, subscription confirmations, lesson summaries,
 * streak notifications, weekly digests, and post-call transcripts.
 */
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";

const RESEND_API_URL = "https://api.resend.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const APP_NAME = "ConnectWorld AI";

// Email templates
const TEMPLATES = {
  welcome: (name: string) => ({
    subject: `Welcome to ${APP_NAME}! 🌍`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #7C3AED; margin-bottom: 8px;">Welcome to ${APP_NAME}!</h1>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi ${name},</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">You've just taken the first step toward mastering a new language. Here's what you can do next:</p>
        <ul style="font-size: 15px; color: #555; line-height: 2;">
          <li>🎓 Start your first AI tutor session</li>
          <li>🎵 Translate your favorite songs</li>
          <li>📺 Watch immersive video lessons</li>
          <li>🗣️ Practice pronunciation with real-time feedback</li>
        </ul>
        <a href="connectworldai://home" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; font-weight: 600;">Open ${APP_NAME}</a>
        <p style="font-size: 14px; color: #999; margin-top: 32px;">Happy learning! 🚀<br/>The ${APP_NAME} Team</p>
      </div>
    `,
  }),

  subscriptionConfirmation: (name: string, plan: string, renewalDate: string) => ({
    subject: `Your ${plan} subscription is active! ✨`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #7C3AED;">Subscription Confirmed</h1>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi ${name},</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Your <strong>${plan}</strong> subscription is now active. Here's what you've unlocked:</p>
        <div style="background: #F3F0FF; border-radius: 12px; padding: 20px; margin: 16px 0;">
          <p style="margin: 0; font-size: 15px; color: #5B21B6;">✅ Unlimited AI tutor sessions</p>
          <p style="margin: 8px 0 0; font-size: 15px; color: #5B21B6;">✅ All languages & dialects</p>
          <p style="margin: 8px 0 0; font-size: 15px; color: #5B21B6;">✅ Offline content downloads</p>
          <p style="margin: 8px 0 0; font-size: 15px; color: #5B21B6;">✅ ConnectWorld AI TV full access</p>
        </div>
        <p style="font-size: 14px; color: #666;">Next renewal: ${renewalDate}</p>
        <p style="font-size: 14px; color: #999; margin-top: 32px;">The ${APP_NAME} Team</p>
      </div>
    `,
  }),

  callTranscript: (name: string, agentName: string, duration: string, transcript: { role: string; text: string }[]) => ({
    subject: `Your ${agentName} session transcript 📝`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #7C3AED;">Session Transcript</h1>
        <p style="font-size: 16px; color: #333;">Hi ${name}, here's your conversation with ${agentName} (${duration}):</p>
        <div style="background: #F9FAFB; border-radius: 12px; padding: 20px; margin: 16px 0;">
          ${transcript.map(t => `
            <div style="margin-bottom: 12px;">
              <strong style="color: ${t.role === "agent" ? "#7C3AED" : "#333"};">${t.role === "agent" ? agentName : "You"}:</strong>
              <span style="color: #555;"> ${t.text}</span>
            </div>
          `).join("")}
        </div>
        <a href="connectworldai://call-history" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View in App</a>
      </div>
    `,
  }),

  weeklyDigest: (name: string, stats: { minutesPracticed: number; wordsLearned: number; streak: number; rank: string }) => ({
    subject: `Your weekly progress: ${stats.minutesPracticed} min practiced! 📊`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #7C3AED;">Weekly Progress Report</h1>
        <p style="font-size: 16px; color: #333;">Hi ${name}, here's how you did this week:</p>
        <div style="display: flex; gap: 16px; margin: 24px 0;">
          <div style="background: #F3F0FF; border-radius: 12px; padding: 16px; text-align: center; flex: 1;">
            <div style="font-size: 28px; font-weight: 700; color: #7C3AED;">${stats.minutesPracticed}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">Minutes</div>
          </div>
          <div style="background: #F0FFF4; border-radius: 12px; padding: 16px; text-align: center; flex: 1;">
            <div style="font-size: 28px; font-weight: 700; color: #22C55E;">${stats.wordsLearned}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">Words</div>
          </div>
          <div style="background: #FFF7ED; border-radius: 12px; padding: 16px; text-align: center; flex: 1;">
            <div style="font-size: 28px; font-weight: 700; color: #F59E0B;">${stats.streak}🔥</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">Streak</div>
          </div>
        </div>
        <p style="font-size: 14px; color: #666;">Leaderboard rank: <strong>${stats.rank}</strong></p>
        <a href="connectworldai://progress-dashboard" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; font-weight: 600;">See Full Report</a>
      </div>
    `,
  }),

  streakReminder: (name: string, streak: number) => ({
    subject: `Don't break your ${streak}-day streak! 🔥`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 16px;">🔥</div>
        <h1 style="color: #F59E0B;">${streak}-Day Streak!</h1>
        <p style="font-size: 16px; color: #333;">Hi ${name}, you haven't practiced today yet. Keep your streak alive!</p>
        <p style="font-size: 14px; color: #666; margin: 16px 0;">Just 5 minutes is enough to maintain your streak.</p>
        <a href="connectworldai://home" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Practice Now</a>
      </div>
    `,
  }),
};

// Helper to send email via Resend API
async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return { success: false, error: "API key not configured" };
  }

  try {
    const response = await fetch(`${RESEND_API_URL}/emails`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// tRPC Router
export const resendRouter = router({
  // Send welcome email
  sendWelcome: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
    }))
    .mutation(async ({ input }) => {
      const template = TEMPLATES.welcome(input.name);
      return sendEmail(input.email, template.subject, template.html);
    }),

  // Send subscription confirmation
  sendSubscriptionConfirmation: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
      plan: z.string(),
      renewalDate: z.string(),
    }))
    .mutation(async ({ input }) => {
      const template = TEMPLATES.subscriptionConfirmation(input.name, input.plan, input.renewalDate);
      return sendEmail(input.email, template.subject, template.html);
    }),

  // Send call transcript
  sendCallTranscript: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
      agentName: z.string(),
      duration: z.string(),
      transcript: z.array(z.object({
        role: z.string(),
        text: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const template = TEMPLATES.callTranscript(input.name, input.agentName, input.duration, input.transcript);
      return sendEmail(input.email, template.subject, template.html);
    }),

  // Send weekly digest
  sendWeeklyDigest: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
      stats: z.object({
        minutesPracticed: z.number(),
        wordsLearned: z.number(),
        streak: z.number(),
        rank: z.string(),
      }),
    }))
    .mutation(async ({ input }) => {
      const template = TEMPLATES.weeklyDigest(input.name, input.stats);
      return sendEmail(input.email, template.subject, template.html);
    }),

  // Send streak reminder
  sendStreakReminder: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
      streak: z.number(),
    }))
    .mutation(async ({ input }) => {
      const template = TEMPLATES.streakReminder(input.name, input.streak);
      return sendEmail(input.email, template.subject, template.html);
    }),

  // Generic send email (for custom use cases)
  send: protectedProcedure
    .input(z.object({
      to: z.string().email(),
      subject: z.string(),
      html: z.string(),
    }))
    .mutation(async ({ input }) => {
      return sendEmail(input.to, input.subject, input.html);
    }),
});
