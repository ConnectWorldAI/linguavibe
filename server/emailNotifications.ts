import { ENV } from "./_core/env";

// ─── Email Notification System for Affiliates ────────────────────────────────
// Uses Resend API (or falls back to built-in Forge API for email delivery)
// Sends branded emails for: approval, commission earned, payout sent

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  // Try Resend API first
  if (ENV.resendApiKey) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ENV.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: ENV.emailFromAddress,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });
      if (resp.ok) return { success: true };
      const err = await resp.text();
      console.error("[Email] Resend error:", err);
      return { success: false, error: err };
    } catch (e: any) {
      console.error("[Email] Resend failed:", e.message);
      return { success: false, error: e.message };
    }
  }

  // Fallback: use built-in Forge API if available
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    try {
      const resp = await fetch(`${ENV.forgeApiUrl}/v1/email/send`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ENV.forgeApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });
      if (resp.ok) return { success: true };
      return { success: false, error: "Forge email failed" };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  console.warn("[Email] No email provider configured. Set RESEND_API_KEY or use built-in Forge.");
  return { success: false, error: "No email provider configured" };
}

// ─── Email Templates ─────────────────────────────────────────────────────────

const BRAND_HEADER = `
<div style="background: linear-gradient(135deg, #0a7ea4, #7c3aed); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
  <h1 style="color: #fff; margin: 0; font-size: 24px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">ConnectWorld AI</h1>
  <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Affiliate Program</p>
</div>
`;

const BRAND_FOOTER = `
<div style="padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; margin-top: 24px;">
  <p style="color: #687076; font-size: 12px; margin: 0;">ConnectWorld AI Affiliate Program</p>
  <p style="color: #9BA1A6; font-size: 11px; margin: 4px 0 0;">You're receiving this because you're part of our affiliate network.</p>
</div>
`;

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 20px; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    ${BRAND_HEADER}
    <div style="padding: 24px;">
      ${content}
    </div>
    ${BRAND_FOOTER}
  </div>
</body>
</html>`;
}

// ─── Notification Functions ──────────────────────────────────────────────────

export async function sendApprovalEmail(params: {
  email: string;
  name: string;
  referralCode: string;
  referralLink: string;
  tier: string;
  commissionRate: number;
}): Promise<{ success: boolean }> {
  const content = `
    <h2 style="color: #11181C; margin: 0 0 12px; font-size: 20px;">🎉 You're Approved!</h2>
    <p style="color: #687076; line-height: 1.6; margin: 0 0 16px;">
      Hey ${params.name}, welcome to the ConnectWorld AI Affiliate Program! Your application has been approved.
    </p>
    
    <div style="background: #f0fdf4; border: 1px solid #22C55E; border-radius: 10px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #11181C;">Your Affiliate Details:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #687076; font-size: 13px;">Tier:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #11181C; font-size: 13px;">${params.tier === "tier1" ? "Tier 1 (Direct)" : "Tier 2 (Sub-Affiliate)"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #687076; font-size: 13px;">Commission Rate:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #22C55E; font-size: 13px;">${params.commissionRate}%</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #687076; font-size: 13px;">Referral Code:</td>
          <td style="padding: 4px 0; font-weight: 700; color: #7c3aed; font-size: 15px;">${params.referralCode}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #687076; font-size: 13px;">Referral Link:</td>
          <td style="padding: 4px 0; font-size: 12px;"><a href="${params.referralLink}" style="color: #0a7ea4;">${params.referralLink}</a></td>
        </tr>
      </table>
    </div>

    <h3 style="color: #11181C; margin: 20px 0 8px; font-size: 15px;">How to Start Earning:</h3>
    <ol style="color: #687076; line-height: 1.8; padding-left: 20px; margin: 0;">
      <li>Add your referral link to your social media bios (TikTok, Instagram, YouTube)</li>
      <li>Mention your code <strong style="color: #7c3aed;">${params.referralCode}</strong> in your content</li>
      <li>When someone signs up using your code/link, you earn ${params.commissionRate}% commission</li>
      <li>Track your earnings in the Affiliate Dashboard inside the app</li>
      <li>Set up Stripe Connect to receive automatic payouts</li>
    </ol>

    <div style="margin-top: 24px; text-align: center;">
      <a href="https://connectworldai.com/affiliate-dashboard" style="display: inline-block; background: #0a7ea4; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Open Affiliate Dashboard →</a>
    </div>
  `;

  return sendEmail({
    to: params.email,
    subject: "🎉 You're Approved! Welcome to ConnectWorld AI Affiliates",
    html: wrapTemplate(content),
  });
}

export async function sendCommissionEarnedEmail(params: {
  email: string;
  name: string;
  amount: number; // in cents
  referredUserName: string;
  tier: string;
  totalEarnings: number; // in cents
}): Promise<{ success: boolean }> {
  const amountFormatted = (params.amount / 100).toFixed(2);
  const totalFormatted = (params.totalEarnings / 100).toFixed(2);

  const content = `
    <h2 style="color: #11181C; margin: 0 0 12px; font-size: 20px;">💰 Commission Earned!</h2>
    <p style="color: #687076; line-height: 1.6; margin: 0 0 16px;">
      Hey ${params.name}, great news! You just earned a commission.
    </p>
    
    <div style="background: #f0fdf4; border: 1px solid #22C55E; border-radius: 10px; padding: 20px; margin: 16px 0; text-align: center;">
      <p style="margin: 0; font-size: 32px; font-weight: 800; color: #22C55E;">+$${amountFormatted}</p>
      <p style="margin: 4px 0 0; color: #687076; font-size: 13px;">${params.tier === "tier1" ? "Tier 1" : "Tier 2"} Commission</p>
    </div>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 14px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #687076; font-size: 13px;">Referred User:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #11181C; font-size: 13px;">${params.referredUserName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #687076; font-size: 13px;">Commission Type:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #11181C; font-size: 13px;">${params.tier === "tier1" ? "Direct Referral (20%)" : "Sub-Affiliate (5%)"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #687076; font-size: 13px;">Total Earnings:</td>
          <td style="padding: 4px 0; font-weight: 700; color: #22C55E; font-size: 15px;">$${totalFormatted}</td>
        </tr>
      </table>
    </div>

    <p style="color: #687076; font-size: 13px; line-height: 1.6;">
      Keep sharing your referral link and code to earn more! Commissions are paid out via Stripe Connect.
    </p>

    <div style="margin-top: 24px; text-align: center;">
      <a href="https://connectworldai.com/affiliate-dashboard" style="display: inline-block; background: #22C55E; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Earnings →</a>
    </div>
  `;

  return sendEmail({
    to: params.email,
    subject: `💰 You earned $${amountFormatted} in commission!`,
    html: wrapTemplate(content),
  });
}

export async function sendPayoutSentEmail(params: {
  email: string;
  name: string;
  amount: number; // in cents
  stripeTransferId: string;
  commissionCount: number;
}): Promise<{ success: boolean }> {
  const amountFormatted = (params.amount / 100).toFixed(2);

  const content = `
    <h2 style="color: #11181C; margin: 0 0 12px; font-size: 20px;">🏦 Payout Sent!</h2>
    <p style="color: #687076; line-height: 1.6; margin: 0 0 16px;">
      Hey ${params.name}, your affiliate commission payout has been processed!
    </p>
    
    <div style="background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border: 1px solid #22C55E; border-radius: 10px; padding: 20px; margin: 16px 0; text-align: center;">
      <p style="margin: 0; font-size: 36px; font-weight: 800; color: #22C55E;">$${amountFormatted}</p>
      <p style="margin: 4px 0 0; color: #687076; font-size: 13px;">Sent to your Stripe account</p>
    </div>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 14px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #687076; font-size: 13px;">Amount:</td>
          <td style="padding: 4px 0; font-weight: 700; color: #22C55E; font-size: 14px;">$${amountFormatted}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #687076; font-size: 13px;">Commissions Included:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #11181C; font-size: 13px;">${params.commissionCount} commission${params.commissionCount > 1 ? "s" : ""}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #687076; font-size: 13px;">Stripe Transfer ID:</td>
          <td style="padding: 4px 0; color: #0a7ea4; font-size: 12px; font-family: monospace;">${params.stripeTransferId}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #687076; font-size: 13px;">Expected Arrival:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #11181C; font-size: 13px;">2-3 business days</td>
        </tr>
      </table>
    </div>

    <p style="color: #687076; font-size: 13px; line-height: 1.6;">
      Funds will arrive in your connected bank account within 2-3 business days. You can track all payouts in your Affiliate Dashboard.
    </p>

    <div style="margin-top: 24px; text-align: center;">
      <a href="https://connectworldai.com/affiliate-dashboard" style="display: inline-block; background: #0a7ea4; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Payout History →</a>
    </div>
  `;

  return sendEmail({
    to: params.email,
    subject: `🏦 $${amountFormatted} payout sent to your account!`,
    html: wrapTemplate(content),
  });
}
