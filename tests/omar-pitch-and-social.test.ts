import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Omar Outreach Pitch Deck', () => {
  const pitchPath = path.join(__dirname, '..', 'references', 'omar-pitch-deck.md');
  
  it('pitch deck file exists', () => {
    expect(fs.existsSync(pitchPath)).toBe(true);
  });

  it('contains revenue comparison (current vs projected)', () => {
    const content = fs.readFileSync(pitchPath, 'utf-8');
    expect(content).toContain('$20');
    expect(content).toContain('2.1');
  });

  it('contains partnership terms and commission structure', () => {
    const content = fs.readFileSync(pitchPath, 'utf-8');
    expect(content).toContain('25%');
    expect(content).toContain('commission');
  });

  it('contains promo code OMAR2026', () => {
    const content = fs.readFileSync(pitchPath, 'utf-8');
    expect(content).toContain('OMAR2026');
  });

  it('contains the $2.99 Caribbean pricing', () => {
    const content = fs.readFileSync(pitchPath, 'utf-8');
    expect(content).toContain('2.99');
  });
});

describe('Airtable Schema Setup', () => {
  const schemaPath = path.join(__dirname, '..', 'lib', 'airtable-schema.ts');
  
  it('airtable schema file exists', () => {
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  it('contains all 6 tables', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('Creators');
    expect(content).toContain('Content');
    expect(content).toContain('Audience');
    expect(content).toContain('Outreach');
    expect(content).toContain('TeachingPatterns');
    expect(content).toContain('SocialStrategy');
  });

  it('contains field definitions for each table', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('handle');
    expect(content).toContain('followers');
    expect(content).toContain('platform');
    expect(content).toContain('revenue');
  });
});

describe('Social Content Calendar', () => {
  const calendarPath = path.join(__dirname, '..', 'lib', 'social-content-calendar.ts');
  
  it('social content calendar file exists', () => {
    expect(fs.existsSync(calendarPath)).toBe(true);
  });

  it('contains content pillars', () => {
    const content = fs.readFileSync(calendarPath, 'utf-8');
    expect(content).toContain('pronunciation');
    expect(content).toContain('slang');
  });

  it('contains posting schedule (3x/day)', () => {
    const content = fs.readFileSync(calendarPath, 'utf-8');
    expect(content).toContain('7');
    expect(content).toContain('12');
  });

  it('contains avatar assignments', () => {
    const content = fs.readFileSync(calendarPath, 'utf-8');
    expect(content).toContain('avatar');
  });

  it('contains Week 1 batch scripts', () => {
    const content = fs.readFileSync(calendarPath, 'utf-8');
    expect(content).toContain('script');
  });
});

describe('Master Plan Updates (Sections 29-31)', () => {
  const masterPlanPath = path.join(__dirname, '..', 'CONNECTME-AI-MASTER-PLAN.md');
  
  it('master plan exists', () => {
    expect(fs.existsSync(masterPlanPath)).toBe(true);
  });

  it('contains Section 29: Omar Partnership Pitch', () => {
    const content = fs.readFileSync(masterPlanPath, 'utf-8');
    expect(content).toContain('29. Omar Partnership Pitch');
  });

  it('contains Section 30: Airtable Creator Intelligence', () => {
    const content = fs.readFileSync(masterPlanPath, 'utf-8');
    expect(content).toContain('30. Airtable Creator Intelligence');
  });

  it('contains Section 31: Social Content Calendar', () => {
    const content = fs.readFileSync(masterPlanPath, 'utf-8');
    expect(content).toContain('31. ConnectWorld AI Social Content Calendar');
  });

  it('contains the Apify pipeline architecture', () => {
    const content = fs.readFileSync(masterPlanPath, 'utf-8');
    expect(content).toContain('Apify');
    expect(content).toContain('Airtable');
    expect(content).toContain('Manus');
  });

  it('version updated to 5.7', () => {
    const content = fs.readFileSync(masterPlanPath, 'utf-8');
    expect(content).toContain('Version 5.7');
  });
});
