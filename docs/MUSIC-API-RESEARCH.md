# Music Generation API Research: Suno vs ElevenLabs

## Summary

For ConnectWorld AI's language learning songs feature, **Suno** is the better choice for cost-effective full song generation, while **ElevenLabs** is better for high-quality vocal TTS and dubbing. For our use case (generating learning songs in multiple languages), Suno offers the best value.

## Suno Pricing (May 2025)

| Plan | Price | Credits | Songs | Commercial Use |
|------|-------|---------|-------|----------------|
| Free | $0/mo | 50/day | ~10/day | No |
| Pro | $8/mo | 2,500/mo | ~500/mo | Yes |
| Premier | $24/mo | 10,000/mo | ~2,000/mo | Yes |

- Cost per song: ~$0.016 (Pro) to ~$0.012 (Premier)
- Full songs with vocals, lyrics, and production
- Supports multiple languages
- V5.5 model available on paid plans
- No official API (uses unofficial/third-party wrappers like suno-api on GitHub)

## ElevenLabs Music API Pricing

| Metric | Cost |
|--------|------|
| Music generation | $0.15/minute |
| Voice Isolator | $0.12/minute |
| TTS (Multilingual v2/v3) | $0.10/1K chars |
| TTS (Flash/Turbo) | $0.05/1K chars |
| Dubbing | $0.33/minute |

- Official API available
- Multilingual support (English, Spanish, German, Japanese, etc.)
- Commercial use on Starter+ plans
- Music Finetunes for custom sound
- 5 minute duration limit per generation
- 44.1kHz, 128-192kbps audio quality

## Cost Comparison (per 3-minute learning song)

| Provider | Cost per song | Quality | API Access |
|----------|--------------|---------|------------|
| Suno Pro | ~$0.016 | Excellent full production | Unofficial (third-party) |
| Suno Premier | ~$0.012 | Excellent full production | Unofficial (third-party) |
| ElevenLabs | ~$0.45 | Studio-grade, controllable | Official API |

## Recommendation

**Primary: ElevenLabs Music API** — Despite higher per-song cost, it offers:
- Official, stable API (critical for production app)
- Multilingual vocals built-in
- Fine-tuning capability for consistent brand sound
- Commercial licensing included
- Can combine with their TTS for synchronized lyrics narration
- Better control over genre, style, and structure

**Secondary: Suno** — For bulk content generation:
- Use Suno Premier for batch-generating song library content
- Much cheaper for volume ($24/mo for 2000 songs)
- No official API is a risk for production use

## Implementation Plan

1. Use ElevenLabs Music API for on-demand song generation in-app
2. Pre-generate a library of learning songs using Suno (manual/batch)
3. Display synchronized lyrics with dual-language translation
4. Allow users to request songs in their target language
