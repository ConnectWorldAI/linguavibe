# API Setup Guide — ConnectWorld AI

This guide walks you through setting up the three remaining API integrations for ConnectWorld AI's auto-post pipeline and song features.

---

## 1. Instagram API (Auto-Post Reels)

Instagram uses the **Meta Graph API** for content publishing. You need a Meta Business account and a connected Instagram Professional account.

### Prerequisites
- An Instagram **Business** or **Creator** account (not a personal account)
- A Facebook Page linked to that Instagram account
- A Meta Developer account

### Step-by-Step

**Step 1: Create a Meta Developer Account**
1. Go to [https://developers.facebook.com](https://developers.facebook.com)
2. Click **Get Started** in the top-right
3. Log in with your Facebook account
4. Accept the Meta Platform Terms and complete verification

**Step 2: Create a New App**
1. Go to [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/)
2. Click **Create App**
3. Select **"Other"** as the use case
4. Select **"Business"** as the app type
5. Enter app name: `ConnectWorld AI`
6. Enter contact email
7. Click **Create App**

**Step 3: Add Instagram Product**
1. In your app dashboard, find **"Add Products"** in the left sidebar
2. Find **"Instagram"** and click **Set Up**
3. Select **"Instagram API with Instagram Login"**

**Step 4: Configure Instagram API**
1. In the left sidebar, click **Instagram > API setup with Instagram business login**
2. Click **Generate Token** next to your Instagram account
3. You'll be prompted to log in to Instagram and authorize the app
4. Select these permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_insights`
   - `pages_read_engagement`

**Step 5: Get Your Long-Lived Token**
1. The generated token is short-lived (1 hour)
2. Exchange it for a long-lived token (60 days) using this URL:
   ```
   https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}
   ```
3. Copy the `access_token` from the response — this is your **INSTAGRAM_API_KEY**

**Step 6: Get Your Instagram User ID**
1. Make this API call:
   ```
   GET https://graph.facebook.com/v21.0/me/accounts?access_token={TOKEN}
   ```
2. Find your Page ID from the response
3. Then get your Instagram Business Account ID:
   ```
   GET https://graph.facebook.com/v21.0/{PAGE_ID}?fields=instagram_business_account&access_token={TOKEN}
   ```
4. The `instagram_business_account.id` is your **INSTAGRAM_USER_ID**

**Step 7: Submit for App Review (for production)**
1. Go to **App Review > Permissions and Features**
2. Request: `instagram_content_publish`, `instagram_basic`
3. Provide a screencast showing how your app uses the API
4. Wait for approval (typically 3-5 business days)

### What You'll Give Me
| Secret | Value |
|--------|-------|
| `INSTAGRAM_API_KEY` | Your long-lived access token |
| `INSTAGRAM_USER_ID` | Your Instagram Business Account ID |

### Important Notes
- Long-lived tokens expire after **60 days** — you'll need to refresh them
- During development, you can use the short-lived token for testing
- Video Reels must be hosted at a public URL before publishing (our pipeline handles this via S3)

---

## 2. YouTube API (Auto-Post Shorts)

YouTube uses **Google OAuth 2.0** with the **YouTube Data API v3** for video uploads.

### Prerequisites
- A Google account with a YouTube channel
- Access to Google Cloud Console

### Step-by-Step

**Step 1: Create a Google Cloud Project**
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it: `ConnectWorld AI`
4. Click **Create**

**Step 2: Enable YouTube Data API v3**
1. In the left sidebar, go to **APIs & Services > Library**
2. Search for **"YouTube Data API v3"**
3. Click on it → Click **Enable**

**Step 3: Create OAuth 2.0 Credentials**
1. Go to **APIs & Services > Credentials**
2. Click **+ Create Credentials > OAuth client ID**
3. If prompted, configure the **OAuth consent screen** first:
   - User Type: **External**
   - App name: `ConnectWorld AI`
   - User support email: your email
   - Developer contact: your email
   - Click **Save and Continue** through all steps
4. Back in Credentials, click **+ Create Credentials > OAuth client ID**
5. Application type: **Web application**
6. Name: `ConnectWorld AI YouTube`
7. Authorized redirect URIs: add `https://linguavibe-jrzmasfr.manus.space/oauth/callback`
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

**Step 4: Get a Refresh Token**
1. Open this URL in your browser (replace `{CLIENT_ID}`):
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id={CLIENT_ID}&redirect_uri=https://linguavibe-jrzmasfr.manus.space/oauth/callback&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload+https://www.googleapis.com/auth/youtube&access_type=offline&prompt=consent
   ```
2. Sign in and authorize the app
3. You'll be redirected with a `code` parameter in the URL
4. Exchange the code for tokens:
   ```bash
   curl -X POST https://oauth2.googleapis.com/token \
     -d "code={AUTH_CODE}" \
     -d "client_id={CLIENT_ID}" \
     -d "client_secret={CLIENT_SECRET}" \
     -d "redirect_uri=https://linguavibe-jrzmasfr.manus.space/oauth/callback" \
     -d "grant_type=authorization_code"
   ```
5. Copy the `refresh_token` from the response

**Step 5: Verify Quota**
1. Go to **APIs & Services > Dashboard**
2. Click on **YouTube Data API v3**
3. Check your quota — default is **10,000 units/day**
4. Each video upload costs **1,600 units** = ~6 uploads/day on free tier
5. If you need more, click **Quotas** and request an increase

### What You'll Give Me
| Secret | Value |
|--------|-------|
| `YOUTUBE_CLIENT_ID` | OAuth 2.0 Client ID |
| `YOUTUBE_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `YOUTUBE_REFRESH_TOKEN` | The refresh token from Step 4 |

### Important Notes
- Refresh tokens don't expire unless you revoke access
- Shorts are just regular video uploads with `#Shorts` in the title and vertical aspect ratio (our pipeline already handles this)
- While in "Testing" mode, only test users you add can authorize — publish the app for production use
- Quota resets daily at midnight Pacific Time

---

## 3. Spotify API (Song Search & Metadata)

Spotify uses **Client Credentials** flow for searching songs (no user login needed).

### Prerequisites
- A Spotify account (free or premium)

### Step-by-Step

**Step 1: Create a Spotify Developer Account**
1. Go to [https://developer.spotify.com](https://developer.spotify.com)
2. Click **Log in** (top-right) and sign in with your Spotify account
3. Accept the Developer Terms of Service

**Step 2: Create an App**
1. Go to [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in:
   - App name: `ConnectWorld AI`
   - App description: `Language learning through music translation`
   - Redirect URI: `https://linguavibe-jrzmasfr.manus.space/oauth/callback`
   - Check **Web API** under "Which API/SDKs are you planning to use?"
4. Check the Terms of Service box
5. Click **Save**

**Step 3: Get Your Credentials**
1. On your app page, you'll see the **Client ID** displayed
2. Click **View client secret** to reveal the **Client Secret**
3. Copy both values

**Step 4: Test It Works**
Run this in your terminal to verify:
```bash
curl -X POST "https://accounts.spotify.com/api/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id={YOUR_CLIENT_ID}&client_secret={YOUR_CLIENT_SECRET}"
```
You should get back an `access_token` — that means it's working.

### What You'll Give Me
| Secret | Value |
|--------|-------|
| `SPOTIFY_CLIENT_ID` | Your app's Client ID |
| `SPOTIFY_CLIENT_SECRET` | Your app's Client Secret |

### Important Notes
- Client Credentials flow gives access to **public data only** (search, track metadata, audio features) — perfect for our song lookup use case
- No user authorization needed for searching songs
- Rate limit: ~30 requests/second (more than enough)
- Spotify recently restricted new app creation — if the dashboard shows issues, try again in a few hours or contact Spotify support
- **Note:** Spotify does NOT provide actual audio files via API. We use it for metadata (title, artist, BPM, key) and the user provides the audio source separately

---

## Summary Checklist

| Platform | URL | Time to Set Up | Approval Needed? |
|----------|-----|----------------|-----------------|
| Instagram | [developers.facebook.com](https://developers.facebook.com) | 15-30 min + review wait | Yes (3-5 days for `content_publish`) |
| YouTube | [console.cloud.google.com](https://console.cloud.google.com) | 10-15 min | No (immediate for testing) |
| Spotify | [developer.spotify.com](https://developer.spotify.com) | 5 min | No (immediate) |

### Recommended Order
1. **Spotify** (fastest — 5 minutes, works immediately)
2. **YouTube** (10-15 minutes, works immediately in test mode)
3. **Instagram** (requires app review for content publishing — start this first if you want it soonest)

---

## Once You Have the Keys

Send me the values and I'll configure them in the app:
- `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET`
- `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET` + `YOUTUBE_REFRESH_TOKEN`
- `INSTAGRAM_API_KEY` + `INSTAGRAM_USER_ID`

I'll then wire the auto-post pipeline to publish to all three platforms simultaneously.
