import { describe, it, expect } from 'vitest';

describe('FAL_KEY validation', () => {
  it('should authenticate with fal.ai API', async () => {
    const FAL_KEY = process.env.FAL_KEY;
    expect(FAL_KEY).toBeDefined();
    expect(FAL_KEY!.length).toBeGreaterThan(10);

    // Test authentication by checking the queue status endpoint
    const response = await fetch('https://queue.fal.run/fal-ai/kling-video/lip-sync', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Minimal request just to test auth - will fail on validation but auth should pass
        audio_url: 'https://example.com/test.mp3',
        video_url: 'https://example.com/test.mp4',
      }),
    });

    // We expect either a 200 (queued), 422 (validation error but auth passed), or 400 (bad request but auth passed)
    // A 401 or 403 means the key is invalid
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });
});
