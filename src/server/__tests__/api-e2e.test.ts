/**
 * Spellful — Phase 5 End-to-End API Tests (Static Analysis)
 *
 * Verifies the correctness of:
 *  - Navigation structure (Header.tsx NAV array)
 *  - Route registration (routes.tsx)
 *  - Database schema integrity (schema.ts)
 *  - API endpoint registration (entry.ts)
 *  - Seed script completeness (scripts/seed.ts)
 *
 * These tests run entirely via static file analysis — no server, no DB.
 * HTTP behaviour tests live in api-http.test.ts.
 *
 * Run with: npm test -- src/server/__tests__/api-e2e.test.ts
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const cwd = process.cwd();
const read = (rel: string) => readFileSync(resolve(cwd, rel), 'utf-8');

// ─── Navigation structure ─────────────────────────────────────────────────────

describe('Navigation structure (Header.tsx)', () => {
  const src = readFileSync(resolve(cwd, 'src/layouts/parts/Header.tsx'), 'utf-8');

  it('Home is a plain link with no children', () => {
    const homeBlock = src.match(/label: 'Home'[\s\S]*?(?=\},\s*\{)/)?.[0] ?? '';
    expect(homeBlock).toContain("href: '/'");
    expect(homeBlock).not.toContain('children:');
  });

  it('About is a plain link with no children', () => {
    const aboutBlock = src.match(/label: 'About'[\s\S]*?(?=\},\s*\{)/)?.[0] ?? '';
    expect(aboutBlock).toContain("href: '/about'");
    expect(aboutBlock).not.toContain('children:');
  });

  it('Community is authOnly: true', () => {
    const idx = src.indexOf("label: 'Community'");
    expect(idx).toBeGreaterThan(0);
    const block = src.slice(idx, idx + 500);
    expect(block).toContain('authOnly: true');
  });

  it('My Sanctuary is authOnly: true', () => {
    const idx = src.indexOf("label: 'My Sanctuary'");
    expect(idx).toBeGreaterThan(0);
    const block = src.slice(idx, idx + 500);
    expect(block).toContain('authOnly: true');
  });

  it('Learn dropdown contains all 7 educational routes', () => {
    const idx = src.indexOf("label: 'Learn'");
    expect(idx).toBeGreaterThan(0);
    const block = src.slice(idx, idx + 900);
    for (const route of ['/resources', '/tarot', '/herbs', '/moon-ritual', '/birth-chart', '/moon-calendar', '/calendar']) {
      expect(block).toContain(route);
    }
  });

  it('Practice dropdown contains spell library and dashboard', () => {
    const idx = src.indexOf("label: 'Practice'");
    expect(idx).toBeGreaterThan(0);
    const block = src.slice(idx, idx + 700);
    expect(block).toContain('/spells');
    expect(block).toContain('/dashboard');
  });

  it('Dream Journal and Cosmic Timeline are authRequired in Practice', () => {
    const idx = src.indexOf("label: 'Practice'");
    const block = src.slice(idx, idx + 700);
    const dreamIdx = block.indexOf('/dream-journal');
    const timelineIdx = block.indexOf('/timeline');
    expect(dreamIdx).toBeGreaterThan(0);
    expect(timelineIdx).toBeGreaterThan(0);
    expect(block.slice(dreamIdx, dreamIdx + 60)).toContain('authRequired: true');
    expect(block.slice(timelineIdx, timelineIdx + 60)).toContain('authRequired: true');
  });

  it('NAV has exactly 6 top-level items', () => {
    const navStart = src.indexOf('const NAV: NavItem[]');
    const navEnd = src.indexOf('];', navStart) + 2;
    const navBlock = src.slice(navStart, navEnd);
    // Top-level items are objects at 2-space indent: lines that are exactly "  {"
    const topLevelObjects = navBlock.split(/\r?\n/).filter((line) => line === '  {');
    expect(topLevelObjects.length).toBe(6);
  });

  it('Sign In is NOT inside any dropdown children array', () => {
    const navStart = src.indexOf('const NAV: NavItem[]');
    const navEnd = src.indexOf('];', navStart) + 2;
    const navBlock = src.slice(navStart, navEnd);
    expect(navBlock).not.toContain("href: '/login'");
  });
});

// ─── Route coverage ───────────────────────────────────────────────────────────

describe('Route coverage (routes.tsx)', () => {
  const src = read('src/routes.tsx');

  const expectedRoutes = [
    '/', '/about', '/tarot', '/herbs', '/spells', '/dashboard',
    '/grimoire', '/sanctuary', '/community', '/community/new',
    '/moon-ritual', '/birth-chart', '/moon-calendar', '/timeline',
    '/dream-journal', '/login', '/account', '/privacy', '/terms',
  ];

  for (const route of expectedRoutes) {
    it(`route '${route}' is registered`, () => {
      expect(src).toContain(`'${route}'`);
    });
  }

  it('/community/new is registered before any dynamic community slug', () => {
    const newIdx = src.indexOf("'/community/new'");
    expect(newIdx).toBeGreaterThan(0);
    for (const pattern of ["'/:slug'", "'/community/:"]) {
      const slugIdx = src.indexOf(pattern);
      if (slugIdx > 0) expect(newIdx).toBeLessThan(slugIdx);
    }
  });
});

// ─── Schema integrity ─────────────────────────────────────────────────────────

describe('Database schema integrity', () => {
  const src = read('src/server/db/schema.ts');

  const communityTables = [
    'communityPosts', 'communityReplies', 'communityCategories',
    'communityLikes', 'communityBookmarks', 'communityFollows',
    'communityBlocks', 'communityPolls', 'communityPollVotes',
  ];

  for (const table of communityTables) {
    it(`exports community table: ${table}`, () => {
      expect(src).toContain(`export const ${table}`);
    });
  }

  const featureTables = [
    'user', 'grimoireEntries', 'tarotReadings', 'timelineEntries',
    'moonRituals', 'synastryPartners', 'conversations', 'messages',
    'userPublicKeys', 'spells', 'spellReviews', 'herbs', 'candles',
  ];

  for (const table of featureTables) {
    it(`exports feature table: ${table}`, () => {
      expect(src).toContain(`export const ${table}`);
    });
  }

  it('user table has all Spellful profile fields', () => {
    const start = src.indexOf("export const user = mysqlTable('user'");
    const end = src.indexOf(');', start) + 2;
    const block = src.slice(start, end);
    for (const field of ['username', 'bio', 'witchPath', 'profileVisibility', 'sunSign', 'moonSign', 'risingSign', 'isAdmin']) {
      expect(block).toContain(field);
    }
  });

  it('communityPosts has all required columns', () => {
    const start = src.indexOf("export const communityPosts");
    const end = src.indexOf(');', start) + 2;
    const block = src.slice(start, end);
    for (const col of ['userId', 'categoryId', 'type', 'title', 'body', 'isPinned', 'isLocked', 'isHidden', 'likeCount', 'replyCount', 'viewCount']) {
      expect(block).toContain(col);
    }
  });

  it('messages table uses E2E encryption fields', () => {
    const start = src.indexOf("export const messages");
    const end = src.indexOf(');', start) + 2;
    const block = src.slice(start, end);
    expect(block).toContain('ciphertext');
    expect(block).toContain('iv');
  });
});

// ─── API endpoint registration ────────────────────────────────────────────────

describe('API endpoint registration (entry.ts)', () => {
  const src = read('src/server/entry.ts');

  const requiredPaths = [
    '/api/community/posts',
    '/api/community/notifications',
    '/api/community/bookmarks',
    '/api/community/search',
    '/api/community/reports',
    '/api/admin/community',
    '/api/grimoire',
    '/api/spells',
    '/api/herbs',
    '/api/tarot',
    '/api/sanctuary',
    '/api/timeline',
    '/api/moon-rituals',
    '/api/health',
  ];

  for (const path of requiredPaths) {
    it(`registers route: ${path}`, () => {
      expect(src).toContain(path);
    });
  }
});

// ─── Seed script ──────────────────────────────────────────────────────────────

describe('Seed script (scripts/seed.ts)', () => {
  it('seed script exists', () => {
    expect(existsSync(resolve(cwd, 'scripts/seed.ts'))).toBe(true);
  });

  const src = read('scripts/seed.ts');

  it('defines all 4 test users', () => {
    for (const email of ['admin@spellful.test', 'sage@spellful.test', 'raven@spellful.test', 'ember@spellful.test']) {
      expect(src).toContain(email);
    }
  });

  it('defines all 8 community categories', () => {
    for (const slug of ['general', 'tarot', 'spells', 'moon', 'herbs', 'crystals', 'astrology', 'shadow-work']) {
      expect(src).toContain(`slug: '${slug}'`);
    }
  });

  it('seeds grimoire, timeline, tarot readings, and moon rituals', () => {
    for (const fn of ['seedGrimoireEntries', 'seedTimelineEntries', 'seedTarotReadings', 'seedMoonRituals']) {
      expect(src).toContain(fn);
    }
  });

  it('is idempotent — checks for existing rows before inserting', () => {
    const checks = (src.match(/existing\.length > 0/g) ?? []).length;
    expect(checks).toBeGreaterThanOrEqual(5);
  });

  it('seeds community posts with a pinned welcome post', () => {
    expect(src).toContain('Welcome to the Spellful Community');
    expect(src).toContain('isPinned: true');
  });

  it('seeds community replies', () => {
    expect(src).toContain('seedReplies');
    expect(src).toContain('communityReplies');
  });

  it('npm seed script is registered in package.json', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    expect(pkg.scripts.seed).toBeDefined();
    expect(pkg.scripts.seed).toContain('seed.ts');
  });
});
