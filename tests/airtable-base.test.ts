import { describe, it, expect } from 'vitest';

describe('AIRTABLE_BASE_ID validation', () => {
  it('should connect to the Airtable base successfully', async () => {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    
    expect(AIRTABLE_API_KEY).toBeDefined();
    expect(AIRTABLE_BASE_ID).toBeDefined();
    expect(AIRTABLE_BASE_ID).toMatch(/^app[a-zA-Z0-9]+$/);

    // Test by listing tables in the base
    const response = await fetch(
      `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    // 200 = success, 403 = key doesn't have access to this base, 404 = base not found
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.tables).toBeDefined();
    expect(Array.isArray(data.tables)).toBe(true);
  });
});
