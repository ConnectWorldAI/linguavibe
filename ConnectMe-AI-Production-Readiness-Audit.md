# ConnectWorld AI — Production Readiness Audit

**Prepared by Manus AI | May 29, 2026**

This report provides a comprehensive audit of ConnectWorld AI across three dimensions: UI/UX improvements to outclass competitors, every API integration required with step-by-step setup instructions, and remaining feature gaps that must be closed before real users can use the app.

---

## Part 1: UI/UX Improvements

ConnectWorld AI currently has 250 screens — a massive feature set. However, several UI patterns need polish to match the quality bar of a first-party iOS app and stand out against Apple's built-in Translate and T-Mobile's carrier-level translation.

### 1.1 High-Impact Visual Improvements

| Area | Current State | Recommended Fix |
|------|--------------|-----------------|
| **Onboarding** | Functional but text-heavy | Add animated illustrations per step (Lottie animations), progress dots, and the tagline "Join ConnectWorld AI Where You Learn And Hear The World Your Way" |
| **Home Screen** | Dense card grid | Add a hero greeting with user's name + streak count, reduce visual density, use larger touch targets (44pt minimum per Apple HIG) |
| **Tab Bar** | 5+ tabs with hidden tabs via floating button | Simplify to 4 visible tabs (Home, Translate, Learn, More), move Messages and Calls to a floating action button or inside "More" |
| **Call Screen** | Static avatar with waveform | Add a pulsing glow ring around the avatar that reacts to Hume's emotional output, animated sound waves that match speech cadence |
| **Translation Screen** | Tools grid with small icons | Use larger cards with preview thumbnails, group by category (Voice, Text, Media, Live) |
| **Dark Mode** | Functional but flat | Add subtle neon blue glow effects on active elements (matching the logo's electric blue), gradient backgrounds on key cards |
| **Loading States** | Basic spinners | Replace with skeleton screens (shimmer placeholders) for all list views and content screens |
| **Empty States** | Generic "No data" text | Add illustrated empty states with actionable CTAs ("Start your first lesson", "Make your first call") |
| **Micro-interactions** | Minimal | Add haptic feedback on all primary actions, subtle scale animations on card presses, confetti on streak milestones |

### 1.2 Navigation & Information Architecture

The app has grown to 250 screens, which creates discoverability challenges. The recommended restructuring:

| Tab | What Lives Here | Key Screens |
|-----|----------------|-------------|
| **Home** | Dashboard, daily challenges, streak, quick actions, notifications | Personalized feed, XP progress, cultural calendar |
| **Translate** | All translation tools, live translate, URL translate, voice clone | Translator, live call translation, screen overlay, offline packs |
| **Learn** | Lessons, courses, SRS review, flashcards, pronunciation | Learning path, karaoke, AI teachers, vocabulary |
| **More** | Profile, settings, messages, calls, social, music, jobs | Everything else accessible from a clean menu |

### 1.3 Typography & Spacing Audit

The app should enforce consistent spacing tokens throughout. Recommended values based on Apple HIG:

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-xs` | 4px | Inline icon gaps |
| `spacing-sm` | 8px | Between related elements |
| `spacing-md` | 16px | Section padding |
| `spacing-lg` | 24px | Between sections |
| `spacing-xl` | 32px | Screen top/bottom padding |
| `font-title` | 28-34px, Bold | Screen titles |
| `font-heading` | 20-22px, Semibold | Section headers |
| `font-body` | 16-17px, Regular | Body text |
| `font-caption` | 13-14px, Regular | Secondary text |

---

## Part 2: API Integrations — Complete Setup Guide

ConnectWorld AI references **16 external APIs**. Below is every single one, what it powers, whether you need it, the exact URL to sign up, and step-by-step instructions to get the API key.

### 2.1 Priority Tier: CRITICAL (App Won't Function Without These)

---

#### 1. Hume AI (EVI) — Voice Calls, AI Teachers, Emotional Intelligence

**Status:** CONFIGURED (keys are set and verified working)

**What it powers:** All AI voice calls (CloudWave, AI Teachers, Surprise Calls, Pronunciation Coach), emotional intelligence detection, empathic voice responses.

**Pricing:** Free tier gives 10,000 characters (~10 min). Starter $3/mo (30 min), Creator $14/mo (140 min). Production apps need the Growth plan or higher. [1]

**Your keys are already set.** No action needed.

> **Signup URL:** https://platform.hume.ai/sign-up

---

#### 2. ElevenLabs — HD Voice TTS, Voice Cloning, Conversational AI Agents

**Status:** NEEDS KEY

**What it powers:** Premium HD voice for translations (speech-to-speech), voice clone studio, pronunciation tutor agent, partner chat agent, support agent, scenario conversation agent. Referenced in 4 server files.

**Pricing:** Free tier gives 10,000 characters/mo. Starter $5/mo (30,000 chars), Scale $22/mo (100,000 chars), Pro $99/mo (500,000 chars). Conversational AI agents have separate per-minute pricing. [2]

**Step-by-step setup:**

1. Go to **https://elevenlabs.io/sign-up** and create an account
2. After login, click your profile icon (top-right) → **Profile + API key**
3. Click **"Create API Key"**, name it "ConnectWorld AI Production"
4. Copy the key (starts with `sk_...`)
5. For **Conversational AI Agents**, go to **https://elevenlabs.io/app/conversational-ai**
6. Create 5 agents:
   - **Tutor Agent** → Copy the Agent ID → this becomes `EXPO_PUBLIC_ELEVENLABS_TUTOR_AGENT_ID`
   - **Partner Agent** → Copy Agent ID → `EXPO_PUBLIC_ELEVENLABS_PARTNER_AGENT_ID`
   - **Pronunciation Agent** → Copy Agent ID → `EXPO_PUBLIC_ELEVENLABS_PRONUNCIATION_AGENT_ID`
   - **Scenario Agent** → Copy Agent ID → `EXPO_PUBLIC_ELEVENLABS_SCENARIO_AGENT_ID`
   - **Support Agent** → Copy Agent ID → `EXPO_PUBLIC_ELEVENLABS_SUPPORT_AGENT_ID`

| Env Variable | Where to Get It |
|-------------|-----------------|
| `ELEVENLABS_API_KEY` | Profile → API key page |
| `EXPO_PUBLIC_ELEVENLABS_TUTOR_AGENT_ID` | Conversational AI → Tutor agent → Agent ID |
| `EXPO_PUBLIC_ELEVENLABS_PARTNER_AGENT_ID` | Conversational AI → Partner agent → Agent ID |
| `EXPO_PUBLIC_ELEVENLABS_PRONUNCIATION_AGENT_ID` | Conversational AI → Pronunciation agent → Agent ID |
| `EXPO_PUBLIC_ELEVENLABS_SCENARIO_AGENT_ID` | Conversational AI → Scenario agent → Agent ID |
| `EXPO_PUBLIC_ELEVENLABS_SUPPORT_AGENT_ID` | Conversational AI → Support agent → Agent ID |

---

#### 3. RevenueCat — In-App Subscriptions (iOS + Android)

**Status:** NEEDS KEY

**What it powers:** All subscription management, paywall enforcement, tier gating (Plus/Pro/Enterprise), receipt validation, cross-platform purchase sync.

**Pricing:** Free up to $2,500/mo MTR (monthly tracked revenue). Then 1% of revenue above that. [3]

**Step-by-step setup:**

1. Go to **https://app.revenuecat.com/signup** and create an account
2. Click **"Create New Project"** → Name it "ConnectWorld AI"
3. **For iOS (Apple):**
   - Click **"Apple App Store"** under Platforms
   - You need an **App Store Connect Shared Secret** (App Store Connect → Your App → App Information → App-Specific Shared Secret)
   - You need an **App Store Connect API Key** (Users and Access → Integrations → In-App Purchase → Generate)
   - Paste both into RevenueCat
   - Copy the **Apple API Key** from RevenueCat → this is `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY`
4. **For Android (Google):**
   - Click **"Google Play Store"** under Platforms
   - Upload your **Google Play Service Account JSON** (Google Cloud Console → IAM → Service Accounts → Create → Grant "Pub/Sub Admin" + "Viewer" roles → Download JSON)
   - Copy the **Google API Key** from RevenueCat → this is `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY`
5. **Create Entitlements:**
   - `plus_access`, `pro_access`, `enterprise_access`
6. **Create Products:**
   - `connectworld_plus_monthly`, `connectworld_plus_yearly`
   - `connectworld_pro_monthly`, `connectworld_pro_yearly`
   - `connectworld_enterprise_monthly`, `connectworld_enterprise_yearly`
7. **Create Offering** called `default` and attach all 6 products
8. For server-side validation: go to **Project Settings → API Keys → Secret API Key** → this is `REVENUECAT_SECRET_API_KEY`
9. For webhooks: go to **Project Settings → Webhooks** → set URL to `https://your-domain.com/api/revenuecat-webhook` → copy the webhook secret → this is `REVENUECAT_WEBHOOK_SECRET`

| Env Variable | Where to Get It |
|-------------|-----------------|
| `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY` | RevenueCat → Project → Apple Platform → Public API Key |
| `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY` | RevenueCat → Project → Google Platform → Public API Key |
| `REVENUECAT_SECRET_API_KEY` | RevenueCat → Project Settings → API Keys → Secret |
| `REVENUECAT_WEBHOOK_SECRET` | RevenueCat → Project Settings → Webhooks → Secret |

---

### 2.2 Priority Tier: HIGH (Core Features Depend on These)

---

#### 4. OpenAI — LLM (Built-in) + Realtime Translation API

**Status:** BUILT-IN LLM is auto-configured. Realtime Translation API NEEDS KEY.

**What it powers:** The built-in server LLM handles all AI text generation (grammar explanations, story creator, cultural insights, etc.) and does NOT need a key. The **Realtime Translation API** (`gpt-realtime-translate`) powers live speech-to-speech call translation and DOES need a key.

**Pricing:** Realtime Translation: $0.034/minute ($2.04/hour). Standard GPT-4o: $2.50/1M input tokens, $10/1M output tokens. [4]

**Step-by-step setup (for Realtime Translation only):**

1. Go to **https://platform.openai.com/signup** and create an account
2. Go to **https://platform.openai.com/api-keys**
3. Click **"Create new secret key"** → Name it "ConnectWorld AI Realtime"
4. Copy the key (starts with `sk-...`)
5. Add billing: **https://platform.openai.com/settings/organization/billing** → Add payment method → Set a usage limit (recommend $50/mo to start)

| Env Variable | Where to Get It |
|-------------|-----------------|
| `OPENAI_API_KEY` | OpenAI Platform → API Keys → Create new secret key |

---

#### 5. Resend — Transactional Email

**Status:** NEEDS KEY

**What it powers:** Email verification during signup, password resets, affiliate program emails, drip campaigns, class invitations, weekly digest emails.

**Pricing:** Free tier: 3,000 emails/mo, 1 domain. Pro: $20/mo for 50,000 emails. [5]

**Step-by-step setup:**

1. Go to **https://resend.com/signup** and create an account
2. Go to **https://resend.com/domains** → Add your domain (e.g., `connectworldai.com`)
3. Add the DNS records Resend provides (MX, TXT, DKIM) to your domain registrar
4. Wait for verification (usually 5-30 minutes)
5. Go to **https://resend.com/api-keys** → Click "Create API Key" → Name it "ConnectWorld AI" → Select "Full access"
6. Copy the key (starts with `re_...`)

| Env Variable | Where to Get It |
|-------------|-----------------|
| `RESEND_API_KEY` | Resend → API Keys → Create API Key |
| `RESEND_FROM_EMAIL` | Your verified domain email, e.g., `noreply@connectworldai.com` |

---

#### 6. APIFrame (Suno Proxy) — AI Music Generation

**Status:** NEEDS KEY

**What it powers:** Generate learning songs, karaoke tracks, personalized music lessons, song covers. Uses Suno V5 through APIFrame's proxy since Suno has no official public API.

**Pricing:** APIFrame starts at $19/mo. Each Suno generation costs ~$0.10. [6]

**Step-by-step setup:**

1. Go to **https://apiframe.ai/signup** and create an account
2. Choose a plan (Starter $19/mo is fine to start)
3. Go to **Dashboard → API Keys**
4. Click "Create API Key" → Copy it

| Env Variable | Where to Get It |
|-------------|-----------------|
| `APIFRAME_API_KEY` | APIFrame → Dashboard → API Keys |

---

### 2.3 Priority Tier: MEDIUM (Enhance Experience But Not Blocking)

---

#### 7. Kling AI — Video Generation (Error Corrections, Welcome Videos)

**Status:** NEEDS KEY

**What it powers:** Personalized error correction videos (showing mistakes in lessons), onboarding welcome videos from chosen teachers, celebration videos for milestones.

**Pricing:** Video generation starts at $0.084 per second of video. A 30-second video costs ~$2.52. [7]

**Step-by-step setup:**

1. Go to **https://kling.ai/dev** and sign up for a developer account
2. Go to **https://kling.ai/dev/pricing** and add credits
3. Navigate to **API Management** → Generate Access Key and Secret Key

| Env Variable | Where to Get It |
|-------------|-----------------|
| `KLING_ACCESS_KEY` | Kling AI Dev → API Management → Access Key |
| `KLING_SECRET_KEY` | Kling AI Dev → API Management → Secret Key |

---

#### 8. Synthesia — AI Avatar Videos (ConnectWorld TV, Course Previews)

**Status:** NEEDS KEY

**What it powers:** ConnectWorld AI TV content (educational videos with AI avatars), course preview marketing videos, instructor introduction videos.

**Pricing:** Starter $22/mo (10 min video), Creator $67/mo (30 min). Enterprise pricing for API access — contact sales. [8]

**Step-by-step setup:**

1. Go to **https://www.synthesia.io/signup** and create an account
2. You need at minimum the **Enterprise plan** for API access
3. Contact Synthesia sales at **https://www.synthesia.io/contact** and request API access
4. Once approved, go to **Settings → API** → Copy your API key

| Env Variable | Where to Get It |
|-------------|-----------------|
| `SYNTHESIA_API_KEY` | Synthesia → Settings → API (Enterprise plan required) |

---

#### 9. Airtable — CRM, Slang Knowledge Base, Content Management

**Status:** NEEDS KEY

**What it powers:** Slang dictionary knowledge base, creator/influencer CRM, content pipeline management.

**Pricing:** Free tier: 1,000 records per base, 5 bases. Team: $20/seat/mo. [9]

**Step-by-step setup:**

1. Go to **https://airtable.com/signup** and create an account
2. Create a base called "ConnectWorld AI Content"
3. Go to **https://airtable.com/create/tokens** → Click "Create new token"
4. Name it "ConnectWorld AI", grant `data.records:read` and `data.records:write` scopes
5. Select your base under "Access"
6. Copy the token (starts with `pat...`)
7. Get your Base ID: open your base → the URL will be `https://airtable.com/appXXXXXXXXXX/...` → `appXXXXXXXXXX` is your Base ID

| Env Variable | Where to Get It |
|-------------|-----------------|
| `AIRTABLE_API_KEY` | Airtable → Developer Hub → Personal Access Tokens |
| `AIRTABLE_BASE_ID` | URL of your base (starts with `app...`) |

---

#### 10. Apify — Web Scraping (Auto-Ingest Content Pipeline)

**Status:** NEEDS KEY

**What it powers:** Auto-ingest content from Instagram, TikTok, YouTube creators. Scrapes creator profiles, posts, and engagement data for the content pipeline.

**Pricing:** Free tier: $5/mo platform credits. Starter: $49/mo. [10]

**Step-by-step setup:**

1. Go to **https://console.apify.com/sign-up** and create an account
2. Go to **https://console.apify.com/account/integrations**
3. Copy your **API Token** (shown at the top of the page)

| Env Variable | Where to Get It |
|-------------|-----------------|
| `APIFY_API_TOKEN` | Apify Console → Account → Integrations → API Token |

---

#### 11. Stripe — Payment Processing (Affiliate Payouts, Direct Payments)

**Status:** NEEDS KEY

**What it powers:** Affiliate commission payouts, direct payment processing for enterprise plans, transaction history.

**Pricing:** 2.9% + $0.30 per transaction. No monthly fee. [11]

**Step-by-step setup:**

1. Go to **https://dashboard.stripe.com/register** and create an account
2. Complete business verification (requires business details, bank account)
3. Go to **https://dashboard.stripe.com/apikeys**
4. Copy the **Secret key** (starts with `sk_live_...` for production, `sk_test_...` for testing)
5. Start with test mode keys, switch to live when ready

| Env Variable | Where to Get It |
|-------------|-----------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys → Secret key |

---

#### 12. Higgsfield — AI Marketing Videos

**Status:** NEEDS KEY

**What it powers:** Automated marketing video generation, social media content creation, promotional clips.

**Pricing:** Usage-based. Sign up for pricing details. [12]

**Step-by-step setup:**

1. Go to **https://cloud.higgsfield.ai/** and sign in (Apple, Google, or Microsoft)
2. Navigate to **API Settings** after login
3. Generate an API key and secret

| Env Variable | Where to Get It |
|-------------|-----------------|
| `HIGGSFIELD_API_KEY` | Higgsfield Cloud → API Settings → API Key |
| `HIGGSFIELD_API_SECRET` | Higgsfield Cloud → API Settings → Secret |

---

### 2.4 Priority Tier: LOW (Nice-to-Have, Can Be Added Later)

---

#### 13. TikTok API — Creator Content Ingestion

**Status:** NEEDS KEY (optional)

**What it powers:** Ingesting TikTok creator content for the auto-ingest pipeline.

**Step-by-step:** Apply at **https://developers.tiktok.com/** → Create an app → Request `user.info.basic` and `video.list` scopes → Submit for review.

| Env Variable | Where to Get It |
|-------------|-----------------|
| `TIKTOK_API_KEY` | TikTok Developer Portal → Your App → Client Key |

---

#### 14. SMTP (Email Fallback)

**Status:** OPTIONAL (Resend is primary)

**What it powers:** Fallback email delivery if Resend is unavailable.

| Env Variable | Where to Get It |
|-------------|-----------------|
| `SMTP_HOST` | Your email provider (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | Usually `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | Your email address |
| `SMTP_PASS` | App-specific password |

---

### 2.5 Summary: All API Keys at a Glance

| # | Service | Env Variable(s) | Priority | Est. Monthly Cost | Status |
|---|---------|-----------------|----------|-------------------|--------|
| 1 | **Hume AI** | `HUME_API_KEY`, `HUME_SECRET_KEY` | CRITICAL | $14-99/mo | SET |
| 2 | **ElevenLabs** | `ELEVENLABS_API_KEY` + 5 Agent IDs | CRITICAL | $22-99/mo | NEEDS KEY |
| 3 | **RevenueCat** | 2 public keys + secret + webhook | CRITICAL | Free to $2.5K MTR | NEEDS KEY |
| 4 | **OpenAI** | `OPENAI_API_KEY` | HIGH | $20-100/mo | NEEDS KEY |
| 5 | **Resend** | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | HIGH | Free-$20/mo | NEEDS KEY |
| 6 | **APIFrame** | `APIFRAME_API_KEY` | HIGH | $19/mo | NEEDS KEY |
| 7 | **Kling AI** | `KLING_ACCESS_KEY`, `KLING_SECRET_KEY` | MEDIUM | Usage-based | NEEDS KEY |
| 8 | **Synthesia** | `SYNTHESIA_API_KEY` | MEDIUM | $67+/mo | NEEDS KEY |
| 9 | **Airtable** | `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` | MEDIUM | Free-$20/mo | NEEDS KEY |
| 10 | **Apify** | `APIFY_API_TOKEN` | MEDIUM | Free-$49/mo | NEEDS KEY |
| 11 | **Stripe** | `STRIPE_SECRET_KEY` | MEDIUM | 2.9% + $0.30/txn | NEEDS KEY |
| 12 | **Higgsfield** | `HIGGSFIELD_API_KEY`, `HIGGSFIELD_API_SECRET` | LOW | Usage-based | NEEDS KEY |
| 13 | **TikTok** | `TIKTOK_API_KEY` | LOW | Free | NEEDS KEY |
| 14 | **SMTP** | 4 SMTP vars | LOW | Free | OPTIONAL |

**Estimated total monthly API cost for production:** $150-400/mo at moderate usage (before scaling).

---

## Part 3: Feature Gaps — What's Missing for Production

### 3.1 Must-Have Before Launch

| Feature | Why It's Blocking | Effort |
|---------|-------------------|--------|
| **Real push notifications** | Users won't return without reminders for SRS reviews, streaks, class times | Medium — server-side already has `exp.host` push code, needs device token registration flow |
| **Onboarding completion gate** | New users can currently skip onboarding and land on a confusing home screen | Small — add a flag in AsyncStorage, redirect to onboarding if not completed |
| **Offline mode graceful degradation** | If user loses connection mid-lesson, the app should cache progress and sync later | Medium — add a network status listener + queue for pending actions |
| **Error boundaries on every screen** | A crash in one screen shouldn't white-screen the whole app | Small — wrap each screen in an error boundary component |
| **Rate limiting / usage caps enforcement** | Free tier users can currently access unlimited AI calls | Medium — add a usage counter per user per feature, check before each API call |
| **Terms of Service / Privacy Policy** | Required for App Store and Play Store submission | Small — screens exist but need real legal content |

### 3.2 Should-Have for Competitive Edge

| Feature | What It Adds | Effort |
|---------|-------------|--------|
| **Lottie animations on achievements** | Confetti, badge unlocks, streak milestones — makes the app feel alive | Small |
| **Widget support (iOS/Android)** | Daily word widget, streak counter on home screen — drives daily engagement | Medium |
| **Apple Watch / WearOS companion** | Quick vocabulary review on wrist, streak notifications | Large |
| **Siri Shortcuts / Google Assistant** | "Hey Siri, start my Spanish lesson" | Medium |
| **Share to ConnectWorld AI** | Share a URL/text from any app → auto-translate in ConnectWorld AI | Medium |
| **Family plan management** | Parents can manage children's accounts, see progress | Medium |

### 3.3 Features That Would Differentiate from Apple/T-Mobile

| Feature | Why It Matters |
|---------|---------------|
| **Voice emotion coaching** | After a call, show the user how their emotional tone was perceived and how to sound more natural in the target language. Neither Apple nor T-Mobile teaches you anything. |
| **Cultural context warnings** | During translation, flag when a phrase is culturally inappropriate in the target region (e.g., "coger" means different things in Spain vs. Latin America). No competitor does this. |
| **Dialect confidence score** | Show users how well they're matching their target dialect (Dominican vs. Mexican Spanish). Unique to ConnectWorld AI. |
| **Learning from your own calls** | After every translated call, extract vocabulary and grammar patterns and add them to the user's SRS deck. Your calls become lessons. |
| **Pronunciation heat map** | Visual overlay showing which phonemes the user struggles with most, with targeted drills. |

---

## Part 4: Recommended Action Plan

### Phase 1: Get the App Functional (This Week)

1. Set up **ElevenLabs** API key + create 5 conversational agents
2. Set up **OpenAI** API key for realtime translation
3. Set up **RevenueCat** with Apple/Google store products
4. Set up **Resend** for email verification
5. Set up **APIFrame** for music generation
6. Test the full call flow end-to-end with real Hume + ElevenLabs

### Phase 2: Polish the UI (Next Week)

1. Add skeleton loading screens to all list views
2. Add illustrated empty states
3. Implement consistent spacing tokens
4. Add Lottie animations for achievements and streaks
5. Refine the tab bar to 4 visible tabs
6. Add error boundaries to every screen

### Phase 3: Prepare for App Store (Week 3)

1. Set up RevenueCat products in App Store Connect and Google Play Console
2. Add real Terms of Service and Privacy Policy content
3. Implement usage caps and rate limiting
4. Add push notification device token registration
5. Test on physical iOS and Android devices via Expo Go
6. Generate APK/IPA via the Publish button

### Phase 4: Launch (Week 4)

1. Submit to App Store and Google Play for review
2. Set up Stripe for affiliate payouts
3. Configure Airtable for content management
4. Set up Apify for auto-ingest pipeline
5. Monitor usage and costs, adjust tier pricing as needed

---

## References

[1] Hume AI Pricing — https://www.hume.ai/pricing

[2] ElevenLabs Pricing — https://elevenlabs.io/pricing

[3] RevenueCat Pricing — https://www.revenuecat.com/pricing

[4] OpenAI API Pricing — https://openai.com/api/pricing/

[5] Resend Pricing — https://resend.com/pricing

[6] APIFrame Suno API — https://apiframe.ai/suno-api-for-ai-music-generation

[7] Kling AI API Pricing — https://kling.ai/dev/pricing

[8] Synthesia Pricing — https://www.synthesia.io/pricing

[9] Airtable Pricing — https://airtable.com/pricing

[10] Apify Pricing — https://apify.com/pricing

[11] Stripe Pricing — https://stripe.com/pricing

[12] Higgsfield Cloud — https://cloud.higgsfield.ai/
