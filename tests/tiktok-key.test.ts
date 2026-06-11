import { describe, it, expect } from 'vitest';

describe('TikTok API Key', () => {
  it('TIKTOK_API_KEY is set in environment', () => {
    const key = process.env.TIKTOK_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it('TIKTOK_API_KEY has valid format (non-empty alphanumeric string)', () => {
    const key = process.env.TIKTOK_API_KEY!;
    expect(key).toMatch(/^[a-zA-Z0-9_\-]+$/);
  });
});
