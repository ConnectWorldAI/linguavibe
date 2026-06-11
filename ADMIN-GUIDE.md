# ConnectWorld AI — Admin Operations Guide

This document provides complete access instructions for managing the AI influencer system, content automation pipeline, affiliate program, and all backend services. It serves as your single source of truth for operating the entire platform.

---

## Table of Contents

1. [Admin Command Center Access](#admin-command-center-access)
2. [API Keys & Credentials Required](#api-keys--credentials-required)
3. [Content Auto-Posting Pipeline](#content-auto-posting-pipeline)
4. [Affiliate Attribution System](#affiliate-attribution-system)
5. [Influencer Onboarding Roadmap](#influencer-onboarding-roadmap)
6. [Revenue Tracking & Analytics](#revenue-tracking--analytics)
7. [Server Endpoints & Database](#server-endpoints--database)
8. [Automation & Scheduling](#automation--scheduling)
9. [Troubleshooting](#troubleshooting)

---

## Admin Command Center Access

The Admin Command Center is accessible within the app at the route `/admin-command-center`. This screen is restricted to admin users and provides four main panels:

| Panel | Purpose |
|-------|---------|
| **Content** | Create prompts, select influencer, choose platforms, generate & auto-post |
| **Affiliates** | View all AI avatar and real human affiliate attribution data |
| **Revenue** | Track revenue per influencer, per stream, per platform |
| **Schedule** | Set up recurring content schedules and automation rules |

To access: Navigate to the admin screen from the app's settings or use the direct route. In production, this should be gated behind admin authentication.

---

## API Keys & Credentials Required

Below is the complete list of every API key and credential needed to make the full system operational. Each entry includes the service, what it powers, where to get it, and the environment variable name.

### Core Platform APIs

| Service | Purpose | Env Variable | Get It From |
|---------|---------|--------------|-------------|
| **Hume AI** | Speech-to-speech for live events & video calls | `HUME_API_KEY` | [platform.hume.ai](https://platform.hume.ai) |
| **Hume AI** | Secret key for WebSocket auth | `HUME_SECRET_KEY` | Same Hume dashboard |
| **OpenAI / Anthropic** | LLM for influencer chat responses | Built-in (server LLM) | Already integrated via server |
| **RevenueCat** | In-app purchases & subscription management | `REVENUECAT_API_KEY` | [app.revenuecat.com](https://app.revenuecat.com) |

### Video & Voice Generation APIs

| Service | Purpose | Env Variable | Get It From |
|---------|---------|--------------|-------------|
| **Kling AI** | Video generation with trained avatar faces | `KLING_API_KEY` | [klingai.com](https://klingai.com) |
| **HeyGen** | Alternative video generation with avatar consistency | `HEYGEN_API_KEY` | [heygen.com](https://heygen.com) |
| **Synthesia** | Course preview videos & ConnectWorld AI TV content | `SYNTHESIA_API_KEY` | [synthesia.io](https://synthesia.io) |
| **ElevenLabs** | Voice cloning for influencer voices in videos | `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) |

### Social Media Posting APIs

| Service | Purpose | Env Variable | Get It From |
|---------|---------|--------------|-------------|
| **TikTok Content Posting API** | Auto-post videos to influencer TikTok accounts | `TIKTOK_CLIENT_KEY` | [developers.tiktok.com](https://developers.tiktok.com) |
| **TikTok** | Client secret for OAuth | `TIKTOK_CLIENT_SECRET` | Same TikTok developer portal |
| **Instagram Graph API** | Auto-post Reels/Stories to influencer IG accounts | `INSTAGRAM_ACCESS_TOKEN` | [developers.facebook.com](https://developers.facebook.com) |
| **Meta Business Suite** | Manage IG business accounts | `META_APP_ID` | Meta Business Suite |
| **Meta Business Suite** | App secret | `META_APP_SECRET` | Same portal |
| **YouTube Data API v3** | Auto-upload Shorts/videos to influencer YT channels | `YOUTUBE_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) |
| **YouTube** | OAuth client ID | `YOUTUBE_CLIENT_ID` | Google Cloud Console |
| **YouTube** | OAuth client secret | `YOUTUBE_CLIENT_SECRET` | Google Cloud Console |

### Analytics & Tracking APIs

| Service | Purpose | Env Variable | Get It From |
|---------|---------|--------------|-------------|
| **TikTok Analytics** | Track video performance, engagement | Included in TikTok API | Same credentials |
| **Instagram Insights** | Track Reel/Story performance | Included in Graph API | Same credentials |
| **YouTube Analytics** | Track video views, watch time, revenue | Included in YouTube API | Same credentials |
| **Stripe** | Process affiliate commission payouts | `STRIPE_SECRET_KEY` | [dashboard.stripe.com](https://dashboard.stripe.com) |
| **Stripe** | Publishable key for frontend | `STRIPE_PUBLISHABLE_KEY` | Same Stripe dashboard |

### Push Notifications & Communication

| Service | Purpose | Env Variable | Get It From |
|---------|---------|--------------|-------------|
| **Expo Push** | Push notifications to app users | Built-in | Already configured |
| **SendGrid / Resend** | Email notifications for affiliates | `SENDGRID_API_KEY` | [sendgrid.com](https://sendgrid.com) |

### Optional / Future APIs

| Service | Purpose | Env Variable | Get It From |
|---------|---------|--------------|-------------|
| **Shopify** | Merch store for influencer products | `SHOPIFY_API_KEY` | [shopify.dev](https://shopify.dev) |
| **Printful** | Print-on-demand merch fulfillment | `PRINTFUL_API_KEY` | [printful.com](https://printful.com) |
| **Teachable / Thinkific** | Host paid courses under influencer names | `TEACHABLE_API_KEY` | [teachable.com](https://teachable.com) |

---

## Content Auto-Posting Pipeline

The content pipeline transforms a simple text prompt into a fully produced video posted across all platforms simultaneously.

### Pipeline Flow

```
Step 1: Admin writes prompt in Command Center
         ↓
Step 2: LLM generates video script + caption + hashtags
         (Uses influencer's personality, language, style)
         ↓
Step 3: Video generation (Kling or HeyGen)
         - Uses trained avatar face for consistency
         - Applies influencer's visual style
         ↓
Step 4: Voice synthesis (ElevenLabs or Hume)
         - Cloned voice matching influencer
         - Emotional tone matching content
         ↓
Step 5: Auto-post to selected platforms
         - TikTok (via Content Posting API)
         - Instagram Reels (via Graph API)
         - YouTube Shorts (via Data API v3)
         - In-app feed (direct database insert)
         ↓
Step 6: Track performance across all platforms
         - Views, likes, comments, shares
         - Attribution tracking (referral links in bio/description)
```

### Platform-Specific Requirements

**TikTok Content Posting API:**
- Each influencer account must be registered as a TikTok developer app
- OAuth 2.0 flow required for each account (one-time setup)
- Video upload endpoint: `POST /v2/post/publish/video/init/`
- Max video length: 10 minutes
- Required scopes: `video.publish`, `video.upload`

**Instagram Graph API:**
- Each influencer needs a Business or Creator Instagram account
- Connected to a Facebook Page
- Reels upload: `POST /{ig-user-id}/media` with `media_type=REELS`
- Stories: `POST /{ig-user-id}/media` with `media_type=STORIES`

**YouTube Data API v3:**
- Each influencer channel needs OAuth consent
- Upload endpoint: `POST /upload/youtube/v3/videos`
- Set `snippet.categoryId` and `status.privacyStatus`
- Shorts: videos under 60 seconds with `#Shorts` in title

---

## Affiliate Attribution System

The system tracks two distinct affiliate categories with different payout structures.

### AI Avatar Influencers (Your Owned IP)

These 12 AI characters generate revenue that is 100% yours. No commissions are paid out. Attribution tracking still applies to measure which avatar drives the most signups.

| Avatar | Referral Code | Referral Link |
|--------|--------------|---------------|
| Natasha (DR) | `NATASHRD` | `connectworldai.com/ref/natasha_rd` |
| Carlos (MX) | `CARLOSMX` | `connectworldai.com/ref/carlos_mx` |
| Valentina (CO) | `VALENTINACO` | `connectworldai.com/ref/valentina_co` |
| Thierry (FR) | `THIERRYFR` | `connectworldai.com/ref/thierry_fr` |
| Bianca (BR) | `BIANCABR` | `connectworldai.com/ref/bianca_br` |
| Kenji (JP) | `KENJIJP` | `connectworldai.com/ref/kenji_jp` |
| Soo-Jin (KR) | `SOOJINKR` | `connectworldai.com/ref/soojin_kr` |
| Omar (EG) | `OMAREG` | `connectworldai.com/ref/omar_ar` |
| Mei Lin (CN) | `MEILINCN` | `connectworldai.com/ref/mei_cn` |
| Marco (IT) | `MARCOIT` | `connectworldai.com/ref/marco_it` |
| Lena (DE) | `LENADE` | `connectworldai.com/ref/lena_de` |
| Arjun (IN) | `ARJUNIN` | `connectworldai.com/ref/arjun_in` |

### Real Human Affiliates — Tier 1

Real language teachers and content creators who promote ConnectWorld AI.

- **Commission**: 20% of first month subscription for each referred user
- **Attribution**: Unique referral code + trackable link
- **Dashboard**: View signups, conversions, earnings, payout history
- **Payout**: Monthly via Stripe Connect (minimum $50 threshold)

### Real Human Affiliates — Tier 2 (Sub-Affiliates)

Affiliates recruited by Tier 1 affiliates.

- **Commission**: 5% of first month subscription from sub-affiliate's referrals
- **Attribution**: Tracked via parent affiliate relationship
- **Incentive**: Tier 1 earns passive income by recruiting other creators
- **Cap**: Tier 2 earnings capped at 50% of Tier 1 earnings to prevent abuse

### How Attribution Works Technically

1. **Cookie-based tracking**: When a user clicks a referral link, a 30-day cookie stores the affiliate ID
2. **Code entry**: Users can manually enter a promo code during signup
3. **Deep links**: QR codes in videos encode the affiliate ID in the URL scheme
4. **First-touch attribution**: The first affiliate to touch the user gets credit
5. **Database storage**: `user.referredBy` field stores the affiliate ID permanently

---

## Influencer Onboarding Roadmap

This is the document you give to each real human affiliate when they join the program.

### For Real Human Affiliates

**Step 1: Sign Up**
- Apply at connectworldai.com/affiliates
- Get approved (manual review or auto-approve for verified creators with 10K+ followers)
- Receive unique referral code and trackable link

**Step 2: Set Up Your Links**
- Add referral link to TikTok bio
- Add referral link to Instagram link-in-bio (Linktree, etc.)
- Add referral link to YouTube video descriptions
- Save your promo code for verbal mentions in videos

**Step 3: Create Content**
- Mention ConnectWorld AI naturally in your language content
- Show the app in use (screen recordings, tutorials)
- Use your promo code verbally: "Use code [YOUR_CODE] for..."
- Post consistently: minimum 2-3 mentions per week

**Step 4: Track Your Earnings**
- Log into your affiliate dashboard
- View real-time signups and conversions
- See which content/platform drives the most signups
- Payouts processed monthly (minimum $50)

**Step 5: Recruit Sub-Affiliates (Optional)**
- Share your unique recruitment link with other creators
- Earn 5% of their referrals passively
- Build a network of language content creators

### Content Calendar Template

| Day | Platform | Content Type | CTA |
|-----|----------|-------------|-----|
| Monday | TikTok | Quick tip / slang lesson | "Link in bio" |
| Tuesday | Instagram Reel | Cultural comparison | "Use code X" |
| Wednesday | TikTok | Duet/reaction to learner | "Link in bio" |
| Thursday | YouTube Short | Mini lesson | "Description link" |
| Friday | Instagram Story | App walkthrough | "Swipe up" |
| Saturday | TikTok | Trending sound + language | "Link in bio" |
| Sunday | YouTube | Long-form lesson | "Description link" |

---

## Revenue Tracking & Analytics

### Revenue Streams Overview

| Stream | Source | Your Cut | Frequency |
|--------|--------|----------|-----------|
| App Subscriptions | User payments via RevenueCat | 70% (after Apple/Google cut) | Monthly recurring |
| AI Avatar Ad Revenue | TikTok Creator Fund, YT AdSense, IG Reels Bonus | 100% | Monthly |
| Brand Deals | Sponsors pay for influencer posts | 100% | Per deal |
| Live Event Tickets | Users pay to join Hume-powered sessions | 100% (minus platform fees) | Per event |
| Affiliate Conversions | Users referred by real affiliates | 80% (20% commission) | Monthly |
| Paid Courses | Courses sold under influencer names | 100% | Per sale |
| Merch Sales | Products sold via Shopify/Printful | ~40% margin | Per sale |
| Licensing | Characters licensed to other platforms | 100% | Per deal |

### Key Metrics to Track

- **Monthly Recurring Revenue (MRR)**: Total subscription revenue
- **Customer Acquisition Cost (CAC)**: Cost per new user (ad spend + affiliate commissions)
- **Lifetime Value (LTV)**: Average revenue per user over their lifetime
- **LTV:CAC Ratio**: Should be > 3:1 for healthy business
- **Affiliate ROI**: Revenue generated vs commissions paid per affiliate
- **Content ROI**: Revenue attributed to specific content pieces
- **Platform Performance**: Which platform (TikTok/IG/YT) drives most conversions

---

## Server Endpoints & Database

### Backend API Base URL

- **Development**: `http://localhost:3000`
- **Production**: Set via `API_URL` environment variable

### Key Server Routes

The server uses tRPC for type-safe API calls. Key routers include:

| Router | Purpose |
|--------|---------|
| `system.*` | Health checks, auth callbacks |
| `influencer.*` | Influencer data, follow/unfollow |
| `chat.*` | LLM-powered chat with influencers |
| `affiliate.*` | Referral tracking, commission calculations |
| `content.*` | Content generation pipeline, posting queue |
| `analytics.*` | Revenue tracking, platform metrics |
| `admin.*` | Admin-only operations, bulk actions |

### Database Tables

| Table | Purpose |
|-------|---------|
| `users` | App users with subscription status |
| `user_referrals` | Which affiliate referred which user |
| `affiliate_accounts` | Real human affiliates (Tier 1 & 2) |
| `affiliate_earnings` | Commission tracking and payout history |
| `content_posts` | Generated content queue and posting status |
| `content_analytics` | Performance metrics per post per platform |
| `live_events` | Scheduled and past live events |
| `chat_messages` | Influencer chat history (for LLM context) |

---

## Automation & Scheduling

### Content Automation

The system supports fully automated content creation and posting:

1. **Recurring Schedules**: Set each influencer to auto-generate content on a schedule (e.g., 3x/week)
2. **Approval Workflow**: Choose between auto-approve (full autopilot) or manual review before posting
3. **Retry Logic**: Failed posts automatically retry up to 3 times
4. **Analytics Sync**: Platform metrics pulled every 6 hours

### Setting Up Automation

In the Admin Command Center → Schedule tab:
- Select influencer
- Set posting frequency per platform
- Choose time slots (optimized for each platform's peak engagement)
- Toggle auto-approve ON/OFF
- Set content themes/topics for the AI to rotate through

### Cron Jobs (Server-Side)

| Job | Frequency | Purpose |
|-----|-----------|---------|
| Content generation | Per schedule | Generate videos from queued prompts |
| Platform posting | Per schedule | Post generated content to social platforms |
| Analytics sync | Every 6 hours | Pull metrics from TikTok/IG/YouTube APIs |
| Commission calculation | Daily | Calculate affiliate earnings |
| Payout processing | Monthly | Process Stripe payouts for affiliates |
| Slang/content update | Weekly | Update influencer knowledge with new trends |

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| TikTok post fails | Check OAuth token expiry; re-authenticate the influencer account |
| Instagram upload rejected | Ensure video meets format requirements (9:16, < 90s for Reels) |
| YouTube quota exceeded | YouTube API has daily quotas; spread uploads across the day |
| Hume connection drops | Check WebSocket connection; ensure `HUME_SECRET_KEY` is valid |
| Affiliate link not tracking | Verify cookie consent on landing page; check UTM parameters |
| Video generation slow | Kling/HeyGen queues can be long; use priority API tier if available |
| Commission calculation wrong | Check `affiliate_earnings` table; verify Tier 1 vs Tier 2 rates |

### Support Contacts

- **TikTok Developer Support**: developers.tiktok.com/support
- **Meta Business Help**: business.facebook.com/help
- **YouTube API Support**: developers.google.com/youtube/support
- **Hume AI Support**: platform.hume.ai/support
- **Stripe Support**: support.stripe.com
- **RevenueCat Support**: app.revenuecat.com/support

---

## Quick Start Checklist

To get the entire system operational, complete these steps in order:

1. [ ] Set up Hume AI account → Get `HUME_API_KEY` and `HUME_SECRET_KEY`
2. [ ] Set up ElevenLabs → Clone each influencer's voice → Get `ELEVENLABS_API_KEY`
3. [ ] Set up Kling AI or HeyGen → Train each influencer's face → Get API key
4. [ ] Create TikTok developer app → OAuth each influencer account → Get credentials
5. [ ] Create Meta/Instagram app → Connect each influencer's IG business account → Get tokens
6. [ ] Create Google Cloud project → Enable YouTube API → OAuth each channel → Get credentials
7. [ ] Set up Stripe Connect → Configure affiliate payout settings → Get keys
8. [ ] Set up RevenueCat → Configure products and entitlements → Get API key
9. [ ] Configure content schedules in Admin Command Center
10. [ ] Onboard first batch of real human affiliates
11. [ ] Test full pipeline: prompt → generate → post → track
12. [ ] Monitor revenue dashboard and optimize

---

*Last updated: May 2026*
*Document maintained by: Platform Admin*
