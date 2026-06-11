# ConnectWorld AI — API Keys, Subscriptions & Services Required

This document lists every external service, API key, and subscription you need to make all ConnectWorld AI features fully functional. Items are organized by priority (what you need first vs. later).

---

## Summary Table

| # | Service | What It Powers | Cost (Launch) | Required By |
|---|---------|----------------|---------------|-------------|
| 1 | Apple Developer Account | App Store publishing, iOS Translation Extension, Push Notifications | $99/year | Phase 1 |
| 2 | Google Play Developer Account | Play Store publishing | $25 one-time | Phase 1 |
| 3 | OpenAI API (GPT-4o + Whisper) | AI translations, pen pal chat, quiz generation, grading, content generation, voice transcription | $50–$200/mo | Phase 1 |
| 4 | ElevenLabs | AI teacher voices, voice cloning, pronunciation feedback | $99–$330/mo | Phase 1 |
| 5 | Stripe or RevenueCat | Payment processing, subscription management | 2.9% + $0.30/txn | Phase 1 |
| 6 | DeepL API | Backup/secondary translation engine | $25–$50/mo | Phase 1 |
| 7 | Twilio | VoIP calling, video calls, SMS verification | $0–$50/mo (launch) | Phase 3 |
| 8 | Stream Chat | Real-time messaging, typing indicators, read receipts | Free (up to 10K MAU) | Phase 3 |
| 9 | Simli | Real-time AI teacher video avatars | $0.05/min pay-per-use | Phase 2 |
| 10 | Synthesia | Pre-recorded video lessons, ConnectWorld AI TV | $64/mo | Phase 4 |
| 11 | HeyGen | Video dubbing/translation for B2B content | $24/mo | Phase 4 |
| 12 | Expo EAS (Build Service) | Building APK/IPA for distribution | Free tier available | Phase 1 |

---

## Phase 1 — Launch Essentials (Must Have Before Publishing)

### 1. Apple Developer Program

- **What:** Required to publish on App Store, enable push notifications, and register the iOS Translation Extension
- **Cost:** $99/year
- **Sign up:** [developer.apple.com](https://developer.apple.com)
- **Features it unlocks:**
  - App Store distribution
  - iOS Translation Extension (making ConnectWorld AI the default translator)
  - Push notifications via APNs
  - Sign in with Apple

### 2. Google Play Developer Account

- **What:** Required to publish on Google Play Store
- **Cost:** $25 one-time
- **Sign up:** [play.google.com/console](https://play.google.com/console)

### 3. OpenAI API

- **What:** Powers all AI features — translation, chat, grading, content generation, voice transcription
- **Cost:** ~$50–$200/month at launch (pay-per-use)
- **Sign up:** [platform.openai.com](https://platform.openai.com)
- **Models used:**
  - **GPT-4o** — AI Pen Pal conversations, quiz generation, homework grading, translation, smart replies, cultural context
  - **Whisper** — Voice message transcription, pronunciation analysis, live call transcription
  - **GPT-4o Vision** — Image translation (camera/screenshot translation)
- **API Key needed:** `OPENAI_API_KEY`
- **Note:** The server has a built-in LLM proxy, so you configure this once on the server side

### 4. ElevenLabs

- **What:** AI voice synthesis for teacher avatars, voice cloning, pronunciation demos
- **Cost:** $99/mo (Starter) to $330/mo (Scale)
- **Sign up:** [elevenlabs.io](https://elevenlabs.io)
- **Features it unlocks:**
  - AI teacher voice responses
  - Voice cloning (user records their voice, hears translations in their own voice)
  - Pronunciation guide audio
  - Voice memos from AI pen pals
- **API Key needed:** `ELEVENLABS_API_KEY`

### 5. Stripe (or RevenueCat for Mobile)

- **What:** Payment processing for subscriptions (Free, Plus $9.99/mo, Pro $24.99/mo, Lifetime $199.99)
- **Cost:** 2.9% + $0.30 per transaction (Stripe); RevenueCat is free up to $2.5K MTR
- **Sign up:** [stripe.com](https://stripe.com) or [revenuecat.com](https://revenuecat.com)
- **Recommendation:** Use **RevenueCat** for mobile — it wraps Apple/Google in-app purchases and handles receipt validation, subscription status, and cross-platform entitlements automatically
- **API Keys needed:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` (or RevenueCat API key)

### 6. DeepL API

- **What:** Backup translation engine for accuracy comparison and fallback
- **Cost:** $25/mo (Developer plan, 500K chars) to $50/mo
- **Sign up:** [deepl.com/pro](https://www.deepl.com/pro)
- **API Key needed:** `DEEPL_API_KEY`

### 7. Expo EAS (Build Service)

- **What:** Builds your APK (Android) and IPA (iOS) for distribution
- **Cost:** Free tier (30 builds/month), $99/mo for priority builds
- **Sign up:** Already included with your Expo account
- **Note:** You can also build locally with `eas build --local` for free

---

## Phase 2 — Core Features (Month 3–4)

### 8. Simli (Real-Time AI Avatars)

- **What:** Powers live AI teacher video calls with lip-synced avatars
- **Cost:** $0.05/minute (pay-per-use); ~$50–$200/mo at launch
- **Sign up:** [simli.com](https://simli.com)
- **Features it unlocks:**
  - Live video calls with AI teachers
  - Real-time lip-synced avatar responses
  - Facial expression matching
- **API Key needed:** `SIMLI_API_KEY`
- **Scale plan:** Upgrade to **Tavus** ($59/mo starter + 15K free minutes startup grant) when revenue allows — it reads student facial expressions

---

## Phase 3 — Social & Communication (Month 5–6)

### 9. Twilio

- **What:** VoIP calling, video calls, SMS verification
- **Cost:** $0.004/min VoIP-to-VoIP; $0.013–$0.085/min VoIP-to-phone
- **Sign up:** [twilio.com](https://www.twilio.com)
- **Features it unlocks:**
  - Voice calls between language partners
  - Video calls with AI teachers and connections
  - Live call translation (real-time audio streaming to Whisper)
  - SMS verification for account security
- **API Keys needed:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### 10. Stream Chat

- **What:** Real-time messaging infrastructure with pre-built React Native UI
- **Cost:** Free up to 10K MAU; $0.01–$0.03/MAU after
- **Sign up:** [getstream.io](https://getstream.io)
- **Features it unlocks:**
  - Real-time messaging between connections
  - Typing indicators, read receipts, reactions
  - Message threads and replies
  - Online/offline presence indicators
- **API Keys needed:** `STREAM_API_KEY`, `STREAM_API_SECRET`

---

## Phase 4 — Content & Entertainment (Month 7–8)

### 11. Synthesia

- **What:** Pre-recorded AI video lessons with diverse avatars
- **Cost:** $64/mo (Creator plan)
- **Sign up:** [synthesia.io](https://synthesia.io)
- **Features it unlocks:**
  - ConnectWorld AI TV pre-recorded lessons
  - Watch & Learn video content library
  - 150+ diverse avatars representing AI teachers from different cultures
- **API Key needed:** `SYNTHESIA_API_KEY`

### 12. HeyGen

- **What:** Video dubbing and translation for B2B content
- **Cost:** $24/mo (Creator plan)
- **Sign up:** [heygen.com](https://heygen.com)
- **Features it unlocks:**
  - Creator Studio video dubbing
  - B2B content translation for enterprise clients
  - Artist Portal song video translations
- **API Key needed:** `HEYGEN_API_KEY`

---

## Optional / Future Services

| Service | Purpose | When Needed | Cost |
|---------|---------|-------------|------|
| **Tavus** (Phoenix-4) | Upgraded real-time avatars with emotional intelligence | Scale (1K+ users) | $59/mo + usage |
| **Google Calendar API** | Calendar sync for study sessions | When users request it | Free |
| **Apple Calendar (EventKit)** | iOS calendar integration | When users request it | Free (native) |
| **Firebase Cloud Messaging** | Push notifications (Android) | Already handled by Expo | Free |
| **Sentry** | Error monitoring and crash reporting | Production launch | Free tier available |
| **Mixpanel / Amplitude** | Product analytics (beyond local walkthrough analytics) | Growth phase | Free tier available |
| **Cloudflare** | CDN for video/audio content delivery | Scale phase | Free tier available |
| **AWS S3** | File storage for user uploads, voice recordings | Already built into server | Included |

---

## What's Already Built-In (No Extra API Keys Needed)

These features are already handled by the Manus platform server infrastructure:

| Feature | Provider | Notes |
|---------|----------|-------|
| LLM/AI (text, image, audio) | Built-in server | Multimodal AI for translations, chat, grading |
| User Authentication | Built-in OAuth | Login, session management |
| Database (PostgreSQL) | Built-in | Cross-device data sync via Drizzle ORM |
| File Storage (S3) | Built-in | User uploads, voice recordings |
| Push Notifications | Built-in | Server-side delivery |
| Image Generation | Built-in | AI-generated content |

**Important:** The built-in server LLM can handle many AI features without a separate OpenAI key. However, for production scale and specific model control (GPT-4o, Whisper, voice cloning), you'll want dedicated API keys.

---

## Setup Priority Order

Here's the order to set things up for the smoothest launch:

1. **Apple Developer Account** + **Google Play Account** → Enables publishing
2. **RevenueCat** (or Stripe) → Enables subscriptions/payments
3. **OpenAI API key** → Powers all AI translations, chat, grading
4. **ElevenLabs API key** → Powers voice features
5. **DeepL API key** → Backup translation quality
6. **Expo EAS** → Build and distribute the app
7. **Simli** → AI teacher video calls (Phase 2)
8. **Twilio + Stream** → Real-time communication (Phase 3)
9. **Synthesia + HeyGen** → Video content (Phase 4)

---

## Total Launch Investment

| Category | Cost |
|----------|------|
| Apple Developer | $99/year |
| Google Play | $25 one-time |
| OpenAI API (first 2 months) | ~$200 |
| ElevenLabs (first 2 months) | ~$198 |
| DeepL (first 2 months) | ~$50 |
| Domain name | ~$15 |
| **Total to launch** | **~$587** |

Monthly recurring after launch: **~$350–$900/month** (scales with users)

---

## Environment Variables to Configure

When you're ready to connect these services, you'll need to set these in the app's Settings > Secrets panel:

```
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
DEEPL_API_KEY=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
STREAM_API_KEY=...
STREAM_API_SECRET=...
SIMLI_API_KEY=...
SYNTHESIA_API_KEY=...
HEYGEN_API_KEY=...
```

I can help you configure any of these when you have the keys ready.
