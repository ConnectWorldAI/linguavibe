# Suno API Integration Notes

## Key Findings (May 2026)

### No Official Public API
Suno does not offer an official public API. Third-party providers offer REST wrappers.

### Best Third-Party Options

| Provider | Pricing | Concurrency | Notes |
|----------|---------|-------------|-------|
| **Apiframe** | $19/mo for 2,000 credits (~180 songs) | 5 | Official SDKs, webhooks |
| **EvoLink** | $0.02-$0.05/generation | High | Enterprise SLA |
| **MusicAPI** | Credit-based, free trial | Varies | Good docs |
| **GoAPI** | $0.02/generation | Medium | Pay-per-use |

### Suno Direct Subscription (Best Value for Our Use Case)
- **Premier Plan**: $30/month for 10,000 credits (~500 songs at 20 credits each)
- Effective cost: ~$0.03-$0.04 per song
- BUT: No official API, would need wrapper/automation

### Recommended Approach
Use **Apiframe** ($19/mo Hobby plan) for API access:
- 2,000 credits/month
- Node.js SDK available
- Webhook support (async generation)
- Suno V5 model access

### API Integration Pattern

```javascript
// Using Apiframe SDK
const { Apiframe } = require('@apiframe-ai/sdk');
const client = new Apiframe({ apiKey: 'YOUR_KEY' });

// Generate a learning song
const job = await client.music.generate({
  model: 'suno',
  prompt: '[Verse 1] Los colores del arcoíris...',
  sunoParams: {
    custom_mode: true,
    instrumental: false,
    model_version: 'V5',
    title: 'Rainbow Colors - Spanish',
    tags: 'educational, pop, upbeat, children'
  }
});

// Poll for completion or use webhook
const finished = await client.jobs.waitFor(job.jobId);
console.log('Audio URL:', finished.result.tracks[0].audio_url);
```

### Alternative: Direct REST API Pattern
```javascript
// POST to generate
const response = await fetch('https://api.apiframe.ai/music/suno/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A catchy Spanish learning song about greetings',
    custom_mode: true,
    lyrics: '[Verse 1]\nHola, buenos días...',
    tags: 'pop, educational, upbeat',
    title: 'Greetings Song',
    model_version: 'V5'
  })
});
const { jobId } = await response.json();

// Poll status
// GET /music/suno/status/{jobId}
```

### Generation Specs
- **Time**: 20-30 seconds for 2-minute clip
- **Quality**: 44.1kHz stereo (V5: 96kHz/24-bit via Apiframe)
- **Max Length**: Up to 8 minutes with extension
- **Vocal Quality**: Near-human, best in class
- **Genre Support**: All genres
- **Commercial Rights**: Included with paid plans

### For Our Language Learning App
- Generate songs with custom lyrics in target language
- Include both original language lyrics and translation
- Use "educational, catchy, pop" style tags
- Store generated songs in library for re-use
- Consider caching/pre-generating popular topics
