# Babbel App Structure & Billing Research

## Navigation Tabs (Mobile App)
Babbel mobile has 3-4 main tabs depending on language:
- **Home** — Main learning path, lessons, progress, suggested podcasts
- **Review** — Spaced repetition with 4 modes: Flashcards, Listening, Speaking, Writing
- **Live** — Babbel Live classes with certified teachers (separate subscription)
- **Explore** — Additional content, stories, games, podcasts

Desktop version has 6 tabs: Home, Live, Prices, Help, Learning Language, Profile

## Subscription Tiers & Pricing
- **Free tier**: First lesson of each language (14 languages), account creation
- **Standard subscription** (one language):
  - 1 month: $17.95/mo
  - 3 months: $15.25/mo ($45 total)
  - 6 months: $13.45/mo ($75 total)  
  - 12 months: $8.95/mo ($107 total)
- **Lifetime** (all 14 languages forever): $299.99 (often on sale for $159-200)
- **Babbel Live** (separate add-on): Unlimited live classes with teachers
  - Has its own 1/3/6/12 month pricing tiers

## Feature Gating Patterns
- Free: Only 1st lesson per language, no review, no podcasts, no games
- Paid: Full courses, all review modes, podcasts, games, stories, speech recognition
- Babbel Live: Completely separate product/subscription for live teacher classes
- Single language lock: Standard subscription = 1 language only
- Lifetime: Unlocks ALL languages

## Paywall Design Patterns (from Purchasely research)
- **Babbel's approach**: Discounted annual subscription highlighted
  - Playful, colorful design
  - 12-month option visually highlighted to draw eye
  - Percentage discount graphic compared to monthly
- **Duolingo Plus**: Family plans (4-6 members), 14-day free trial, clean design
- **Memrise**: Fun illustrations, annual price in green with % discount
- **Blinkist**: Focus on free trial explanation, how to cancel, trust-building
- **Photomath**: "Goldilocks principle" - 3 tiers with middle one highlighted

## Key Takeaways for ConnectWorld AI
1. **Tiered time-based subscriptions** (1/3/6/12 months) with longer = cheaper per month
2. **Highlight the annual plan** with savings percentage badge
3. **Separate premium features** (Live teachers) as add-on tier
4. **Free tier gives a taste** but locks core content behind paywall
5. **Review modes** as distinct sub-features (Flashcards, Listening, Speaking, Writing)
6. **Lifetime option** as premium upsell for power users
7. **CEFR certificates** as progress milestones
8. **Personalized learning path** based on onboarding quiz

## Duolingo Tab Structure (2026 redesign)
- Lessons (main learning path)
- Quests (daily/monthly challenges, XP goals)
- Leaderboard (competitive rankings)
- Video Calls (AI conversation practice)
- Profile (stats, streaks, achievements)
- Feed/Social (friend activity, celebrations)

Design principles from their refresh:
- Consistency balanced with purpose
- Simplicity balanced with clarity
- Tiered header sizes based on tab purpose
- Minimal type styles, intentional whitespace
- Card-based modular layouts for flexibility
