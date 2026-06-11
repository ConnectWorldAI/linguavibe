# Kling AI API Research

## Authentication
- Uses JWT (HS256) with Access Key as `iss` and Secret Key for signing
- Token valid for 30 minutes
- API Domain: `https://api-singapore.klingai.com` (outside China)
- Authorization header: `Bearer <JWT_TOKEN>`

## Text-to-Video
- POST `/v1/videos/text2video`
- Models: kling-v1, kling-v1-6, kling-v2-master, kling-v2-1-master, kling-v2-5-turbo, kling-v2-6, kling-v3
- Duration: 3-15 seconds
- Modes: std (720p), pro (1080p), 4k
- Aspect ratios: 16:9, 9:16, 1:1
- Sound: on/off
- Multi-shot: up to 6 shots with custom prompts and durations
- Voice list: up to 2 voices with <<<voice_1>>> syntax

## Image-to-Video
- POST `/v1/videos/image2video`
- Same models as text2video
- Supports: image (start frame), image_tail (end frame)
- Camera control: horizontal, vertical, pan, tilt, roll, zoom
- Dynamic/static masks for motion control
- Element list: up to 3 reference subjects

## Query Task
- GET `/v1/videos/text2video/{task_id}` or `/v1/videos/image2video/{task_id}`
- Status: submitted → processing → succeed → failed
- Result contains video URL (expires after 30 days)

## JWT Generation (Node.js)
```javascript
const jwt = require('jsonwebtoken');

function generateKlingToken(accessKey, secretKey) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: accessKey,
    exp: now + 1800, // 30 min
    nbf: now - 5,
  };
  return jwt.sign(payload, secretKey, { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } });
}
```

## Use Cases for ConnectWorld AI
1. Error correction videos (teacher explains mistakes)
2. Personalized onboarding welcome videos
3. ConnectWorld AI TV content
4. Cultural scenario clips for Watch & Learn
5. Vocabulary context videos
