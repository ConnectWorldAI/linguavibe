import { ENV } from "./_core/env";

// ─── Affiliate Onboarding Email Drip Sequence ────────────────────────────────
// 7-day automated series sent after affiliate approval
// Emails are queued and sent on schedule via server-side scheduling

interface DripEmail {
  day: number;
  subject: string;
  html: string;
}

const BRAND_HEADER = `
<div style="background: linear-gradient(135deg, #0a7ea4, #7c3aed); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
  <h1 style="color: #fff; margin: 0; font-size: 24px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">ConnectWorld AI</h1>
  <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Affiliate Program</p>
</div>
`;

const BRAND_FOOTER = `
<div style="padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; margin-top: 24px;">
  <p style="color: #687076; font-size: 12px; margin: 0;">ConnectWorld AI Affiliate Program</p>
  <p style="color: #9BA1A6; font-size: 11px; margin: 4px 0 0;">You're receiving this because you joined our affiliate network.</p>
  <p style="color: #9BA1A6; font-size: 11px; margin: 4px 0 0;"><a href="https://connectworldai.com/affiliate-dashboard" style="color: #0a7ea4;">Manage preferences</a></p>
</div>
`;

function wrap(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 20px; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
<div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
${BRAND_HEADER}<div style="padding: 24px;">${content}</div>${BRAND_FOOTER}
</div></body></html>`;
}

function getDripEmails(name: string, referralCode: string, referralLink: string): DripEmail[] {
  return [
    {
      day: 1,
      subject: `🚀 Day 1: Your Quick Start Guide, ${name}!`,
      html: wrap(`
        <h2 style="color: #11181C; margin: 0 0 12px; font-size: 20px;">Welcome to the Team! 🎉</h2>
        <p style="color: #687076; line-height: 1.7;">Hey ${name}, congrats on getting approved! Here's your quick start checklist to start earning commissions TODAY:</p>
        
        <div style="background: #f8f9fa; border-radius: 10px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: 700; color: #11181C;">Your Referral Info:</p>
          <p style="margin: 4px 0; color: #687076; font-size: 13px;">Code: <strong style="color: #7c3aed; font-size: 15px;">${referralCode}</strong></p>
          <p style="margin: 4px 0; color: #687076; font-size: 13px;">Link: <a href="${referralLink}" style="color: #0a7ea4;">${referralLink}</a></p>
        </div>

        <h3 style="color: #11181C; margin: 20px 0 10px; font-size: 15px;">✅ Do These 3 Things Right Now:</h3>
        <ol style="color: #687076; line-height: 2; padding-left: 20px; margin: 0;">
          <li><strong>Add your link to your TikTok/Instagram bio</strong> — This is where 60% of clicks come from</li>
          <li><strong>Post a story/reel mentioning ConnectWorld AI</strong> — Even a simple "I'm using this to learn Spanish" works</li>
          <li><strong>Set up Stripe Connect</strong> in your <a href="https://connectworldai.com/affiliate-dashboard" style="color: #0a7ea4;">Affiliate Dashboard</a> so you can get paid</li>
        </ol>

        <div style="margin-top: 24px; text-align: center;">
          <a href="https://connectworldai.com/affiliate-dashboard" style="display: inline-block; background: #0a7ea4; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Open Dashboard →</a>
        </div>
      `),
    },
    {
      day: 2,
      subject: `📍 Day 2: Where to Put Your Link for Maximum Clicks`,
      html: wrap(`
        <h2 style="color: #11181C; margin: 0 0 12px; font-size: 20px;">Link Placement Strategy 📍</h2>
        <p style="color: #687076; line-height: 1.7;">Hey ${name}, the #1 mistake new affiliates make is hiding their link. Here's where to put it for maximum visibility:</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22C55E; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-weight: 700; color: #11181C;">🏆 Top Performing Placements:</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 8px; font-weight: 600; color: #11181C; font-size: 13px;">TikTok Bio</td>
            <td style="padding: 10px 8px; color: #22C55E; font-size: 13px; font-weight: 600;">Highest CTR</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 8px; font-weight: 600; color: #11181C; font-size: 13px;">Instagram Link-in-Bio</td>
            <td style="padding: 10px 8px; color: #22C55E; font-size: 13px; font-weight: 600;">Best for multi-link</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 8px; font-weight: 600; color: #11181C; font-size: 13px;">YouTube Description</td>
            <td style="padding: 10px 8px; color: #22C55E; font-size: 13px; font-weight: 600;">First 3 lines visible</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 8px; font-weight: 600; color: #11181C; font-size: 13px;">Pinned Comment</td>
            <td style="padding: 10px 8px; color: #22C55E; font-size: 13px; font-weight: 600;">Great engagement</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; font-weight: 600; color: #11181C; font-size: 13px;">Story Swipe-Up/Link</td>
            <td style="padding: 10px 8px; color: #22C55E; font-size: 13px; font-weight: 600;">Impulse clicks</td>
          </tr>
        </table>

        <h3 style="color: #11181C; margin: 20px 0 10px; font-size: 15px;">💡 Pro Tip:</h3>
        <p style="color: #687076; line-height: 1.7; font-size: 13px;">
          Always say your code out loud in videos: <em>"Use code <strong style="color: #7c3aed;">${referralCode}</strong> to get started"</em>. 
          People watching on their phone can't click links in videos, but they CAN remember a code.
        </p>
      `),
    },
    {
      day: 3,
      subject: `🎬 Day 3: Content Ideas That Actually Convert`,
      html: wrap(`
        <h2 style="color: #11181C; margin: 0 0 12px; font-size: 20px;">Content That Converts 🎬</h2>
        <p style="color: #687076; line-height: 1.7;">Hey ${name}, not all content drives signups equally. Here are the formats that our top affiliates use:</p>

        <div style="margin: 16px 0;">
          <div style="background: #f8f9fa; border-radius: 10px; padding: 14px; margin-bottom: 10px;">
            <p style="margin: 0 0 4px; font-weight: 700; color: #11181C; font-size: 14px;">1. "Day in My Life" Learning Content</p>
            <p style="margin: 0; color: #687076; font-size: 12px; line-height: 1.5;">Show yourself using the app naturally. "I learned this Dominican slang today..." then show the app.</p>
          </div>
          <div style="background: #f8f9fa; border-radius: 10px; padding: 14px; margin-bottom: 10px;">
            <p style="margin: 0 0 4px; font-weight: 700; color: #11181C; font-size: 14px;">2. Before/After Progress Videos</p>
            <p style="margin: 0; color: #687076; font-size: 12px; line-height: 1.5;">"My Spanish 3 months ago vs now" — show real progress, mention the app as your tool.</p>
          </div>
          <div style="background: #f8f9fa; border-radius: 10px; padding: 14px; margin-bottom: 10px;">
            <p style="margin: 0 0 4px; font-weight: 700; color: #11181C; font-size: 14px;">3. Reaction/Duet to Language Content</p>
            <p style="margin: 0; color: #687076; font-size: 12px; line-height: 1.5;">React to slang videos, then say "I learned this on ConnectWorld AI" — great for TikTok algorithm.</p>
          </div>
          <div style="background: #f8f9fa; border-radius: 10px; padding: 14px; margin-bottom: 10px;">
            <p style="margin: 0 0 4px; font-weight: 700; color: #11181C; font-size: 14px;">4. "Did You Know?" Language Facts</p>
            <p style="margin: 0; color: #687076; font-size: 12px; line-height: 1.5;">"In Colombia they say 'parcero' instead of 'amigo'" — educational + entertaining.</p>
          </div>
          <div style="background: #f8f9fa; border-radius: 10px; padding: 14px;">
            <p style="margin: 0 0 4px; font-weight: 700; color: #11181C; font-size: 14px;">5. App Walkthrough/Review</p>
            <p style="margin: 0; color: #687076; font-size: 12px; line-height: 1.5;">Screen record the app, show features, give honest review. These convert at 3x the rate.</p>
          </div>
        </div>

        <div style="background: #7c3aed10; border: 1px solid #7c3aed30; border-radius: 10px; padding: 14px; margin-top: 16px;">
          <p style="margin: 0; font-weight: 600; color: #7c3aed; font-size: 13px;">🔥 Highest Converting CTA:</p>
          <p style="margin: 6px 0 0; color: #687076; font-size: 13px; font-style: italic;">"Link in bio to try it free — use my code ${referralCode} when you sign up!"</p>
        </div>
      `),
    },
    {
      day: 5,
      subject: `⚡ Day 5: Advanced Strategies from Our Top Earners`,
      html: wrap(`
        <h2 style="color: #11181C; margin: 0 0 12px; font-size: 20px;">Advanced Strategies ⚡</h2>
        <p style="color: #687076; line-height: 1.7;">Hey ${name}, you've been in the program for 5 days now. Here's what separates affiliates earning $100/month from those earning $5,000+:</p>

        <h3 style="color: #11181C; margin: 20px 0 10px; font-size: 15px;">📌 Pin Your Best Performing Post</h3>
        <p style="color: #687076; font-size: 13px; line-height: 1.6;">
          Find your video that mentions ConnectWorld AI with the most views. Pin it to the top of your profile. 
          Every new follower sees it first → more clicks → more signups.
        </p>

        <h3 style="color: #11181C; margin: 20px 0 10px; font-size: 15px;">📱 Optimize Your Bio</h3>
        <p style="color: #687076; font-size: 13px; line-height: 1.6;">
          Your bio should clearly state what you do + include a CTA:<br>
          <em style="color: #0a7ea4;">"Teaching you real [language] slang 🇩🇴 | Try the app I use → link below"</em>
        </p>

        <h3 style="color: #11181C; margin: 20px 0 10px; font-size: 15px;">📊 Post Consistently (Not Just Once)</h3>
        <p style="color: #687076; font-size: 13px; line-height: 1.6;">
          Top affiliates mention the app in 2-3 posts per week (not every post). Mix it naturally into your content. 
          The algorithm rewards consistency.
        </p>

        <h3 style="color: #11181C; margin: 20px 0 10px; font-size: 15px;">🎯 Target the Right Audience</h3>
        <p style="color: #687076; font-size: 13px; line-height: 1.6;">
          Best converting audiences: people learning a new language, travelers, expats, heritage speakers reconnecting with their roots, 
          people in bilingual relationships.
        </p>

        <div style="background: #f0fdf4; border: 1px solid #22C55E; border-radius: 10px; padding: 16px; margin-top: 20px; text-align: center;">
          <p style="margin: 0; font-weight: 700; color: #22C55E; font-size: 15px;">💰 Top Affiliate This Month: $4,200 earned</p>
          <p style="margin: 4px 0 0; color: #687076; font-size: 12px;">That could be you. Keep posting!</p>
        </div>
      `),
    },
    {
      day: 7,
      subject: `🎯 Day 7: Double Your Earnings with Tier 2`,
      html: wrap(`
        <h2 style="color: #11181C; margin: 0 0 12px; font-size: 20px;">Unlock Tier 2 Earnings 🎯</h2>
        <p style="color: #687076; line-height: 1.7;">Hey ${name}, you've been crushing it for a week! Here's a way to earn even MORE without creating extra content:</p>

        <div style="background: linear-gradient(135deg, #7c3aed10, #0a7ea410); border: 1px solid #7c3aed30; border-radius: 12px; padding: 20px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px; color: #7c3aed; font-size: 16px;">Tier 2: Sub-Affiliate Program</h3>
          <p style="color: #687076; font-size: 13px; line-height: 1.6; margin: 0;">
            When you recruit OTHER creators to become affiliates, you earn <strong style="color: #22C55E;">5% of THEIR referrals</strong> — forever. 
            They earn their full 20%, and you get an extra 5% on top.
          </p>
        </div>

        <h3 style="color: #11181C; margin: 20px 0 10px; font-size: 15px;">How It Works:</h3>
        <ol style="color: #687076; line-height: 2; padding-left: 20px; margin: 0; font-size: 13px;">
          <li>Share the affiliate signup link with other creators you know</li>
          <li>When they apply, they list you as their referrer</li>
          <li>Once approved, every user THEY bring in earns you 5% too</li>
          <li>This stacks — recruit 10 active affiliates and earn passive income</li>
        </ol>

        <div style="background: #f8f9fa; border-radius: 10px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 4px; font-weight: 700; color: #11181C; font-size: 14px;">💡 Example Math:</p>
          <p style="color: #687076; font-size: 12px; line-height: 1.6; margin: 0;">
            You recruit 5 affiliates → each brings 20 users/month → that's 100 users × 5% commission = 
            <strong style="color: #22C55E;">extra $500+/month in passive income</strong> on top of your own referrals.
          </p>
        </div>

        <h3 style="color: #11181C; margin: 20px 0 10px; font-size: 15px;">Who to Recruit:</h3>
        <ul style="color: #687076; line-height: 1.8; padding-left: 20px; margin: 0; font-size: 13px;">
          <li>Language teachers on TikTok/Instagram</li>
          <li>Travel vloggers who visit Spanish/French/Portuguese-speaking countries</li>
          <li>Polyglot content creators</li>
          <li>Cultural content creators (food, music, dance from other countries)</li>
          <li>Expat/immigrant community creators</li>
        </ul>

        <div style="margin-top: 24px; text-align: center;">
          <a href="https://connectworldai.com/affiliate-signup" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Share Affiliate Signup Link →</a>
        </div>

        <p style="color: #9BA1A6; font-size: 11px; text-align: center; margin-top: 16px;">
          This is the last email in your onboarding series. You'll still receive commission notifications and monthly reports.
        </p>
      `),
    },
  ];
}

// ─── Drip Scheduler ──────────────────────────────────────────────────────────
// Stores scheduled emails in memory (in production, use a proper job queue)

interface ScheduledDrip {
  affiliateId: number;
  email: string;
  name: string;
  referralCode: string;
  referralLink: string;
  scheduledEmails: { day: number; sendAt: Date; sent: boolean }[];
}

const dripQueue: ScheduledDrip[] = [];
let dripIntervalId: ReturnType<typeof setInterval> | null = null;

export function scheduleOnboardingDrip(params: {
  affiliateId: number;
  email: string;
  name: string;
  referralCode: string;
  referralLink: string;
}): void {
  const now = new Date();
  const scheduledEmails = [1, 2, 3, 5, 7].map((day) => ({
    day,
    sendAt: new Date(now.getTime() + day * 24 * 60 * 60 * 1000),
    sent: false,
  }));

  dripQueue.push({
    affiliateId: params.affiliateId,
    email: params.email,
    name: params.name,
    referralCode: params.referralCode,
    referralLink: params.referralLink,
    scheduledEmails,
  });

  console.log(`[Drip] Scheduled 5-email onboarding series for ${params.name} (${params.email})`);

  // Start the drip processor if not already running
  if (!dripIntervalId) {
    startDripProcessor();
  }
}

async function sendDripEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (ENV.resendApiKey) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: ENV.emailFromAddress,
          to,
          subject,
          html,
        }),
      });
      return resp.ok;
    } catch (e) {
      console.error("[Drip] Send failed:", e);
      return false;
    }
  }

  // Fallback to Forge API
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    try {
      const resp = await fetch(`${ENV.forgeApiUrl}/v1/email/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.forgeApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to, subject, html }),
      });
      return resp.ok;
    } catch (e) {
      return false;
    }
  }

  console.warn("[Drip] No email provider configured");
  return false;
}

function startDripProcessor(): void {
  // Check every 5 minutes for emails that need to be sent
  dripIntervalId = setInterval(async () => {
    const now = new Date();

    for (const drip of dripQueue) {
      const emails = getDripEmails(drip.name, drip.referralCode, drip.referralLink);

      for (const scheduled of drip.scheduledEmails) {
        if (!scheduled.sent && now >= scheduled.sendAt) {
          const emailContent = emails.find((e) => e.day === scheduled.day);
          if (emailContent) {
            const success = await sendDripEmail(drip.email, emailContent.subject, emailContent.html);
            if (success) {
              scheduled.sent = true;
              console.log(`[Drip] Sent Day ${scheduled.day} email to ${drip.email}`);
            }
          }
        }
      }
    }

    // Clean up completed drips
    const completed = dripQueue.filter((d) => d.scheduledEmails.every((s) => s.sent));
    for (const c of completed) {
      const idx = dripQueue.indexOf(c);
      if (idx !== -1) dripQueue.splice(idx, 1);
    }

    if (dripQueue.length === 0 && dripIntervalId) {
      clearInterval(dripIntervalId);
      dripIntervalId = null;
    }
  }, 5 * 60 * 1000); // every 5 minutes
}

// Export for testing/admin
export function getDripQueueStatus(): { total: number; pending: number; items: { email: string; nextSend: Date | null }[] } {
  return {
    total: dripQueue.length,
    pending: dripQueue.reduce((sum, d) => sum + d.scheduledEmails.filter((s) => !s.sent).length, 0),
    items: dripQueue.map((d) => ({
      email: d.email,
      nextSend: d.scheduledEmails.find((s) => !s.sent)?.sendAt || null,
    })),
  };
}
