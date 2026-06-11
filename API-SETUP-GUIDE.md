# ConnectWorld AI — Complete API & Credentials Setup Guide

This document provides step-by-step, click-by-click instructions for obtaining every API key, credential, and developer account needed to make the ConnectWorld AI platform fully operational. Each section covers one service, including the exact URL to visit, what to click, and where to paste the resulting key.

---

## Table of Contents

1. [Stripe (Payments & Affiliate Payouts)](#1-stripe-payments--affiliate-payouts)
2. [Resend (Email Notifications & Drip Sequences)](#2-resend-email-notifications--drip-sequences)
3. [Hume AI (Speech-to-Speech for Live Events)](#3-hume-ai-speech-to-speech-for-live-events)
4. [RevenueCat (In-App Subscriptions)](#4-revenuecat-in-app-subscriptions)
5. [TikTok Content Posting API](#5-tiktok-content-posting-api)
6. [Instagram / Meta Graph API](#6-instagram--meta-graph-api)
7. [YouTube Data API v3](#7-youtube-data-api-v3)
8. [Kling AI (Video Generation with Avatar Faces)](#8-kling-ai-video-generation-with-avatar-faces)
9. [HeyGen (Alternative Video Generation)](#9-heygen-alternative-video-generation)
10. [ElevenLabs (Voice Cloning for Influencers)](#10-elevenlabs-voice-cloning-for-influencers)
11. [Google Cloud Vision (OCR Backup)](#11-google-cloud-vision-ocr-backup)
12. [Apple Developer Account (App Store)](#12-apple-developer-account-app-store)
13. [Google Play Developer Account](#13-google-play-developer-account)

---

## 1. Stripe (Payments & Affiliate Payouts)

**What it does:** Processes subscription payments from users AND pays out affiliate commissions via Stripe Connect.

**URL:** https://dashboard.stripe.com/register

**Step-by-step:**

1. Go to https://dashboard.stripe.com/register
2. Enter your email, full name, and create a password
3. Click **"Create account"**
4. Verify your email (check inbox, click the link)
5. Once logged in, click **"Activate payments"** in the top banner
6. Fill in your business details (business name: "ConnectWorld AI", type: "Software", etc.)
7. Add your bank account for receiving payments
8. Complete identity verification (upload ID if requested)

**Getting the API Key:**

1. In the Stripe Dashboard, click **"Developers"** in the left sidebar
2. Click **"API keys"**
3. You'll see two keys:
   - **Publishable key** (starts with `pk_live_`) — used in the app frontend
   - **Secret key** (starts with `sk_live_`) — used on the server
4. Click **"Reveal live key"** next to the Secret key
5. Copy the `sk_live_...` value

**Enabling Stripe Connect (for affiliate payouts):**

1. In the Stripe Dashboard, click **"Connect"** in the left sidebar
2. Click **"Get started"** or **"Settings"**
3. Under Platform settings, set:
   - Platform type: **"Marketplace or platform"**
   - Country: Your country
4. Enable **"Express accounts"** (easiest for affiliates)
5. Under Branding, upload your ConnectWorld AI logo
6. Save settings

**Where to paste:** In the ConnectWorld AI app settings panel (Management UI → Settings → Secrets), add as `STRIPE_SECRET_KEY`

---

## 2. Resend (Email Notifications & Drip Sequences)

**What it does:** Sends all emails — affiliate approval notifications, commission alerts, payout confirmations, and the 7-day onboarding drip sequence.

**URL:** https://resend.com/signup

**Step-by-step:**

1. Go to https://resend.com/signup
2. Sign up with your email or GitHub account
3. Verify your email address
4. Once logged in, you'll land on the Dashboard

**Getting the API Key:**

1. Click **"API Keys"** in the left sidebar
2. Click **"+ Create API Key"**
3. Name it: "ConnectWorld AI Production"
4. Permission: **"Full access"**
5. Click **"Add"**
6. Copy the key (starts with `re_...`) — you'll only see it once

**Setting up your domain (so emails come from your domain):**

1. Click **"Domains"** in the left sidebar
2. Click **"+ Add Domain"**
3. Enter your domain: `connectworldai.com`
4. Click **"Add"**
5. You'll see DNS records to add. Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
6. Add the MX, TXT, and CNAME records shown
7. Wait 5-30 minutes for DNS propagation
8. Back in Resend, click **"Verify"**
9. Once verified, emails will come from `noreply@connectworldai.com`

**Where to paste:** In the app settings, add as `RESEND_API_KEY`

---

## 3. Hume AI (Speech-to-Speech for Live Events)

**What it does:** Powers real-time voice conversations during live events and video calls with AI influencers. Emotional, natural speech-to-speech.

**URL:** https://platform.hume.ai/sign-up

**Step-by-step:**

1. Go to https://platform.hume.ai/sign-up
2. Create an account with email or Google
3. Verify your email
4. Once logged in, you'll see the Hume Dashboard

**Getting the API Key:**

1. Click your profile icon (top-right) → **"Settings"**
2. Click **"API Keys"** in the left sidebar
3. Click **"Create API Key"**
4. Name it: "ConnectWorld AI"
5. Copy the API key

**Setting up EVI (Empathic Voice Interface):**

1. In the Dashboard, click **"EVI"** in the left sidebar
2. Click **"Create Configuration"**
3. Name: "Natasha Dominican Spanish" (create one per influencer)
4. Set the system prompt to match the influencer's personality
5. Choose a voice that matches (or use custom voice)
6. Set language to the influencer's teaching language
7. Save — note the **Config ID**
8. Repeat for each influencer

**Where to paste:** In the app settings, add as `HUME_API_KEY`

---

## 4. RevenueCat (In-App Subscriptions)

**What it does:** Manages in-app purchases and subscriptions across iOS and Android. Handles receipt validation, entitlements, and subscription status.

**URL:** https://app.revenuecat.com/signup

**Step-by-step:**

1. Go to https://app.revenuecat.com/signup
2. Create an account
3. Click **"+ New Project"**
4. Name: "ConnectWorld AI"
5. Click **"Create Project"**

**Connecting to App Store:**

1. In your project, click **"Apps"** → **"+ New App"**
2. Select **"Apple App Store"**
3. Enter your Bundle ID: (the one from app.config.ts)
4. For "App Store Connect API Key":
   - Go to https://appstoreconnect.apple.com/access/integrations/api
   - Click **"+"** to generate a new key
   - Name: "RevenueCat"
   - Access: **"Admin"**
   - Download the .p8 file
   - Copy the Key ID and Issuer ID
5. Back in RevenueCat, paste the Key ID, Issuer ID, and upload the .p8 file
6. Click **"Save"**

**Connecting to Google Play:**

1. Click **"+ New App"** → **"Google Play Store"**
2. Enter your package name (from app.config.ts)
3. For Service Account JSON:
   - Go to https://console.cloud.google.com
   - Create a service account with "Android Publisher" role
   - Download the JSON key
4. Upload the JSON key in RevenueCat
5. Click **"Save"**

**Getting the API Key:**

1. Click **"API Keys"** in the left sidebar
2. Copy the **Public SDK Key** (starts with `appl_...` or `goog_...`)

**Where to paste:** In the app settings, add as `REVENUECAT_API_KEY`

---

## 5. TikTok Content Posting API

**What it does:** Auto-posts videos to your AI influencer TikTok accounts directly from the Admin Command Center.

**URL:** https://developers.tiktok.com/

**Step-by-step:**

1. Go to https://developers.tiktok.com/
2. Click **"Log in"** (use a TikTok account — create one if needed)
3. Click **"Manage apps"** → **"Create app"** (or **"Connect an app"**)
4. Fill in:
   - App name: "ConnectWorld AI Content Manager"
   - Description: "Automated content posting for language learning influencer accounts"
   - Category: **"Content Management"**
5. Click **"Create"**

**Adding Products (Permissions):**

1. In your app, click **"Add products"**
2. Select **"Content Posting API"**
3. Click **"Apply"**
4. Under Scopes, enable:
   - `video.upload` — Upload videos
   - `video.publish` — Publish uploaded videos
5. Submit for review (TikTok reviews within 1-3 business days)

**Getting Credentials:**

1. Once approved, go to your app's **"Keys and Secrets"** section
2. Copy:
   - **Client Key** (App ID)
   - **Client Secret**
3. Set the Redirect URI to: `https://connectworldai.com/oauth/tiktok/callback`

**Connecting Each Influencer Account:**

1. Each AI influencer needs their own TikTok account
2. Use the OAuth flow to authorize each account
3. Store the access token per influencer in your database

**Where to paste:** In app settings, add `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET`

---

## 6. Instagram / Meta Graph API

**What it does:** Auto-posts Reels and Stories to your AI influencer Instagram accounts.

**URL:** https://developers.facebook.com/

**Step-by-step:**

1. Go to https://developers.facebook.com/
2. Click **"Get Started"** or **"My Apps"**
3. Log in with your Facebook account
4. Click **"Create App"**
5. Select app type: **"Business"**
6. App name: "ConnectWorld AI Content Manager"
7. Click **"Create App"**

**Adding Instagram Graph API:**

1. In your app dashboard, click **"Add Product"** in the left sidebar
2. Find **"Instagram Graph API"** and click **"Set Up"**
3. Under Settings → Basic:
   - Add your Privacy Policy URL
   - Add your Terms of Service URL
   - Set App Domains: `connectworldai.com`
4. Under Instagram Graph API → Settings:
   - Set Redirect URI: `https://connectworldai.com/oauth/instagram/callback`

**Getting Permissions:**

1. Go to **"App Review"** → **"Permissions and Features"**
2. Request these permissions:
   - `instagram_basic` — Read profile info
   - `instagram_content_publish` — Publish content
   - `pages_read_engagement` — Read page data
3. Submit for review with a screencast showing your use case

**Getting Credentials:**

1. Go to **"Settings"** → **"Basic"**
2. Copy:
   - **App ID**
   - **App Secret** (click "Show")

**Connecting Influencer Accounts:**

1. Each influencer needs an Instagram Professional/Business account
2. Each account must be connected to a Facebook Page
3. Use OAuth to get long-lived access tokens per account

**Where to paste:** In app settings, add `META_APP_ID` and `META_APP_SECRET`

---

## 7. YouTube Data API v3

**What it does:** Auto-uploads YouTube Shorts to your AI influencer YouTube channels.

**URL:** https://console.cloud.google.com/

**Step-by-step:**

1. Go to https://console.cloud.google.com/
2. Sign in with your Google account
3. Click **"Select a project"** → **"New Project"**
4. Name: "ConnectWorld AI"
5. Click **"Create"**

**Enabling the YouTube API:**

1. In the project, go to **"APIs & Services"** → **"Library"**
2. Search for **"YouTube Data API v3"**
3. Click on it → Click **"Enable"**

**Creating OAuth Credentials:**

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen first:
   - User type: **"External"**
   - App name: "ConnectWorld AI Content Manager"
   - Support email: your email
   - Authorized domains: `connectworldai.com`
   - Save
4. Back to Create OAuth client ID:
   - Application type: **"Web application"**
   - Name: "ConnectWorld AI YouTube"
   - Authorized redirect URIs: `https://connectworldai.com/oauth/youtube/callback`
5. Click **"Create"**
6. Copy the **Client ID** and **Client Secret**

**Also create an API Key:**

1. Click **"+ Create Credentials"** → **"API Key"**
2. Copy the key
3. Click **"Restrict Key"** → restrict to YouTube Data API v3 only

**Connecting Influencer Channels:**

1. Each influencer needs their own YouTube channel (create via Google accounts)
2. Use OAuth to authorize each channel
3. Store refresh tokens per influencer

**Where to paste:** In app settings, add `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, and `YOUTUBE_API_KEY`

---

## 8. Kling AI (Video Generation with Avatar Faces)

**What it does:** Generates videos with your trained AI influencer faces. The avatar looks consistent across all videos.

**URL:** https://klingai.com/

**Step-by-step:**

1. Go to https://klingai.com/
2. Click **"Sign Up"** or **"Get Started"**
3. Create an account
4. Choose a plan (Pro recommended for commercial use)

**Getting the API Key:**

1. Once logged in, go to **"Account"** → **"API"** or **"Developer"** section
2. Click **"Generate API Key"**
3. Copy the key

**Training Avatar Faces:**

1. Go to **"AI Portraits"** or **"Face Training"** section
2. Upload 10-20 reference images of each influencer (the generated avatar images)
3. Name the model (e.g., "Natasha Dominican")
4. Wait for training to complete (usually 15-30 minutes)
5. Note the **Model ID** for each trained face

**Where to paste:** In app settings, add `KLING_API_KEY`

---

## 9. HeyGen (Alternative Video Generation)

**What it does:** Alternative to Kling for generating talking-head videos with AI influencer avatars. Better for longer-form content.

**URL:** https://www.heygen.com/

**Step-by-step:**

1. Go to https://www.heygen.com/
2. Click **"Sign Up Free"**
3. Create account with email or Google
4. Choose a plan (Creator or Business for API access)

**Getting the API Key:**

1. Once logged in, click your avatar (top-right) → **"Settings"**
2. Click **"API"** in the left sidebar
3. Click **"Generate API Key"**
4. Copy the key

**Creating Avatar Clones:**

1. Go to **"Avatars"** → **"Create Avatar"**
2. Choose **"Photo Avatar"** (for static image-based) or **"Video Avatar"** (for more realistic)
3. Upload the influencer's reference images
4. Follow the prompts to create the avatar
5. Note the **Avatar ID** for each influencer

**Where to paste:** In app settings, add `HEYGEN_API_KEY`

---

## 10. ElevenLabs (Voice Cloning for Influencers)

**What it does:** Creates unique, consistent voices for each AI influencer. Used in video content generation and voice messages.

**URL:** https://elevenlabs.io/

**Step-by-step:**

1. Go to https://elevenlabs.io/
2. Click **"Sign Up"**
3. Create account
4. Choose a plan (Starter or Pro for voice cloning)

**Getting the API Key:**

1. Click your profile icon → **"Profile + API key"**
2. Copy your **API Key** (or click "Generate" if none exists)

**Cloning Influencer Voices:**

1. Go to **"Voices"** → **"Voice Lab"**
2. Click **"+ Add Voice"** → **"Instant Voice Cloning"**
3. For each influencer:
   - Upload 1-5 minutes of sample audio (record yourself speaking in their accent/style, or use AI-generated samples)
   - Name: "Natasha - Dominican Spanish"
   - Add description and labels
   - Click **"Add Voice"**
4. Note the **Voice ID** for each cloned voice
5. Test each voice in the playground

**Where to paste:** In app settings, add `ELEVENLABS_API_KEY`

---

## 11. Google Cloud Vision (OCR Backup)

**What it does:** Backup OCR service for extracting text from video frames. The built-in LLM handles most OCR, but this provides higher accuracy for complex text.

**URL:** https://console.cloud.google.com/

**Step-by-step:**

1. Go to https://console.cloud.google.com/ (same project as YouTube API)
2. Go to **"APIs & Services"** → **"Library"**
3. Search for **"Cloud Vision API"**
4. Click **"Enable"**

**Creating a Service Account:**

1. Go to **"IAM & Admin"** → **"Service Accounts"**
2. Click **"+ Create Service Account"**
3. Name: "connectworld-vision"
4. Role: **"Cloud Vision API User"**
5. Click **"Done"**
6. Click on the new service account → **"Keys"** tab
7. Click **"Add Key"** → **"Create new key"** → **"JSON"**
8. Download the JSON file

**Where to paste:** Upload the JSON content as `GOOGLE_CLOUD_CREDENTIALS` in app settings

---

## 12. Apple Developer Account (App Store)

**What it does:** Required to publish the iOS app on the App Store and process in-app purchases.

**URL:** https://developer.apple.com/programs/enroll/

**Step-by-step:**

1. Go to https://developer.apple.com/programs/enroll/
2. Sign in with your Apple ID (or create one)
3. Click **"Start Your Enrollment"**
4. Choose enrollment type:
   - **Individual** ($99/year) — if you're a sole proprietor
   - **Organization** ($99/year) — if you have an LLC/Corp (requires D-U-N-S number)
5. Fill in personal/business information
6. Pay the $99 annual fee
7. Wait for approval (usually 24-48 hours)

**After Approval:**

1. Go to https://appstoreconnect.apple.com
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - Platform: iOS
   - Name: "ConnectWorld AI"
   - Bundle ID: (select from dropdown — matches app.config.ts)
   - SKU: "connectworldai"
4. Set up In-App Purchases under **"Monetization"** → **"Subscriptions"**

---

## 13. Google Play Developer Account

**What it does:** Required to publish the Android app on Google Play Store and process in-app purchases.

**URL:** https://play.google.com/console/signup

**Step-by-step:**

1. Go to https://play.google.com/console/signup
2. Sign in with your Google account
3. Accept the Developer Distribution Agreement
4. Pay the one-time $25 registration fee
5. Complete identity verification (may take 1-2 days)

**After Approval:**

1. Go to https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - App name: "ConnectWorld AI"
   - Default language: English
   - App type: App
   - Free or paid: Free (with in-app purchases)
4. Complete the store listing, content rating, and pricing sections
5. Set up subscriptions under **"Monetization"** → **"Products"** → **"Subscriptions"**

---

## Summary: All API Keys Needed

| # | Service | Key Name in App Settings | Cost | Priority |
|---|---------|--------------------------|------|----------|
| 1 | Stripe | `STRIPE_SECRET_KEY` | 2.9% + 30¢ per transaction | Critical |
| 2 | Resend | `RESEND_API_KEY` | Free up to 3,000 emails/month | Critical |
| 3 | Hume AI | `HUME_API_KEY` | Pay per minute of voice | High |
| 4 | RevenueCat | `REVENUECAT_API_KEY` | Free up to $2,500 MTR | Critical |
| 5 | TikTok | `TIKTOK_CLIENT_KEY` + `TIKTOK_CLIENT_SECRET` | Free | High |
| 6 | Meta/Instagram | `META_APP_ID` + `META_APP_SECRET` | Free | High |
| 7 | YouTube/Google | `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET` | Free | High |
| 8 | Kling AI | `KLING_API_KEY` | ~$0.10-0.50 per video | Medium |
| 9 | HeyGen | `HEYGEN_API_KEY` | $29-89/month | Medium |
| 10 | ElevenLabs | `ELEVENLABS_API_KEY` | $5-99/month | Medium |
| 11 | Google Vision | `GOOGLE_CLOUD_CREDENTIALS` | Free up to 1,000/month | Low |
| 12 | Apple Developer | N/A (account only) | $99/year | Critical |
| 13 | Google Play | N/A (account only) | $25 one-time | Critical |

---

## Recommended Setup Order

Start with the services that are required for the app to function, then add content generation services:

1. **Stripe** — Payments must work first
2. **RevenueCat** — Subscriptions depend on Stripe + App Store accounts
3. **Apple Developer + Google Play** — Required for publishing
4. **Resend** — Email notifications for affiliates
5. **Hume AI** — Live events and video calls
6. **TikTok + Instagram + YouTube** — Content auto-posting
7. **ElevenLabs** — Voice cloning for influencer content
8. **Kling AI or HeyGen** — Video generation (choose one to start)
9. **Google Cloud Vision** — Optional OCR backup

---

## Where to Add Keys in the App

1. Open the ConnectWorld AI Management UI
2. Click the **Settings** icon (gear) in the panel
3. Go to **"Secrets"** section
4. Click **"+ Add Secret"** for each key
5. Enter the key name exactly as shown in the table above
6. Paste the value
7. Click **"Save"**

The server will automatically pick up the new keys. For some services (TikTok, Instagram, YouTube), you'll also need to complete OAuth flows in the Admin Command Center to connect each influencer's social media accounts.

---

## Social Media Accounts to Create

For the 12 AI influencers, you need to create accounts on each platform:

| Influencer | TikTok | Instagram | YouTube |
|-----------|--------|-----------|---------|
| Natasha (DR) | @natasha_klk | @natasha_klk | Natasha Teaches Spanish |
| Carlos (MX) | @carlos_queonda | @carlos_queonda | Carlos Mexican Spanish |
| Valentina (CO) | @valentina_parce | @valentina_parce | Valentina Colombian |
| Thierry (FR) | @thierry_francais | @thierry_francais | Thierry French |
| Bianca (BR) | @bianca_brasil | @bianca_brasil | Bianca Portuguese |
| Kenji (JP) | @kenji_nihongo | @kenji_nihongo | Kenji Japanese |
| Priya (IN) | @priya_hindi | @priya_hindi | Priya Hindi |
| Lena (DE) | @lena_deutsch | @lena_deutsch | Lena German |
| Arjun (IN) | @arjun_tamil | @arjun_tamil | Arjun Tamil |
| Mei (CN) | @mei_zhongwen | @mei_zhongwen | Mei Chinese |
| Kofi (GH) | @kofi_twi | @kofi_twi | Kofi Twi |
| Fatima (MA) | @fatima_darija | @fatima_darija | Fatima Arabic |

**Total: 36 social media accounts** (12 influencers × 3 platforms)

Each account needs:
- A profile photo (use the generated avatar images)
- A bio mentioning language teaching
- A link to the app in their bio
- Content consistent with their personality

---

*Last updated: May 2026*
