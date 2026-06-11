# ElevenLabs TTS API Notes

## Endpoint
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}

## Headers
- xi-api-key: API key
- Content-Type: application/json

## Request Body
```json
{
  "text": "Text to convert",
  "model_id": "eleven_multilingual_v2",
  "language_code": "es",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0,
    "speed": 1.0
  }
}
```

## Output Formats
- mp3_44100_128 (default)
- mp3_22050_32 (smaller, faster)
- mp3_44100_64 (good quality, reasonable size)

## Key Details
- Returns audio as application/octet-stream (binary)
- Model: eleven_multilingual_v2 supports 32 languages
- language_code uses ISO 639-1 codes
- voice_id required in URL path
- Latency optimization: 0-4 (0=default, 4=max optimization)

## Popular Voice IDs (from ElevenLabs library)
- Rachel: 21m00Tcm4TlvDq8ikWAM (female, American)
- Drew: 29vD33N1CtxCmqQRPOHJ (male, American)
- Clyde: 2EiwWnXFnvU5JabPnv8n (male, American)
- Domi: AZnzlk1XvdvUeBnXmlld (female, American)
- Bella: EXAVITQu4vr4xnSDxMaL (female, American)
- Antoni: ErXwobaYiN019PkySvjV (male, American)
- Elli: MF3mGyEYCl7XYWbV9V6O (female, American)

## Implementation Plan
- Server-side: Create tRPC endpoint that proxies to ElevenLabs
- Client-side: Call server endpoint, receive audio URL/base64, play with expo-audio
- Premium gating: Only available to paid users (costs credits per request)
