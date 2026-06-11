# Synthesia & Kling AI API Research

## Synthesia API
- **Endpoint**: REST API at docs.synthesia.io
- **Auth**: API key (Creator/Enterprise plan required)
- **Key Features**:
  - Create videos with stock avatars (100+ diverse avatars)
  - Custom avatars possible
  - 160+ languages supported
  - Variables allow dynamic avatar/script replacement
  - Video generation is async (submit → poll → download)
- **Integration Pattern**:
  1. POST /videos with avatar_id, script, language
  2. Poll GET /videos/{id} until status = "complete"
  3. Download the generated video URL
- **Avatars**: Diverse stock avatars with IDs (male/female, various ethnicities)
  - EXPRESS-1 versions (faster, simpler)
  - Version 3 (higher quality, multiple camera angles)
- **Use Case for Us**: Teacher avatar videos for virtual classrooms and 1-on-1s

## Kling AI API
- **Endpoint**: https://api-singapore.klingai.com
- **Auth**: JWT token from Access Key + Secret Key
- **Key Features**:
  - Video generation from text prompts
  - Image-to-video generation
  - Native 4K support (Kling 3.0)
  - Virtual try-on capability
- **Integration Pattern**:
  1. Generate JWT token from Access Key + Secret Key
  2. POST to video generation endpoint with prompt/image
  3. Poll for completion
  4. Download generated video
- **Use Case for Us**: Generate entertaining cultural scenario videos, grammar animations, story-based content for lessons

## Implementation Strategy
- Both APIs are async (submit job → poll → get result)
- Both require API keys (will use webdev_request_secrets)
- Synthesia for teacher avatars (consistent faces)
- Kling for creative lesson content (scenarios, animations)
